const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const msgService = require("./groupMessages.service");
const groupService = require("./groups.service");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");


// In-memory map to track who is typing in each group
// { groupId => Map<userId, { name, ts }> }
const typingStatus = new Map();

const normalizeRole = (value) =>
  value ? String(value).trim().toLowerCase() : "";

const resolveGroupRole = async (groupId, user) => {
  if (!user || !user.id) {
    throw new AppError("Not authorized", 403);
  }
  const platformRole = normalizeRole(user.role);
  if (["admin", "superadmin"].includes(platformRole)) {
    return "admin";
  }
  const role = await groupService.getMemberRole(groupId, user.id);
  if (!role) {
    throw new AppError("Not authorized", 403);
  }
  return role;
};


exports.getMessages = catchAsync(async (req, res) => {
  const { id } = req.params;
  await resolveGroupRole(id, req.user);
  const messages = await msgService.listMessages(id);
  sendSuccess(res, messages);
});

exports.sendMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { message, sendEmail, sendWhatsapp } = req.body || {};

  const file = req.files?.file?.[0];
  const audio = req.files?.audio?.[0];

  if (!message && !file && !audio) {
    throw new AppError("Message or attachment required", 400);
  }

  const role = await resolveGroupRole(id, req.user);

  const perms = await groupService.getGroupPermissions(id);
  const rolePerms = perms[role] || {};
  if (!rolePerms.message) throw new AppError("Not authorized", 403);
  if ((file || audio) && !rolePerms.upload) throw new AppError("Not authorized", 403);

  const created = await msgService.createMessage({
    group_id: id,
    sender_id: req.user.id,
    content: message ? message.trim() : "",
    file_url: file ? `/uploads/chat/${file.filename}` : null,
    audio_url: audio ? `/uploads/chat/${audio.filename}` : null,
  });

  const full = await msgService.getMessageById(created.id);

  const group = await groupService.getGroupById(id);
  const members = await groupService.listMembers(id);
  const recipients = members
    .map((m) => m.user_id)
    .filter((uid) => uid !== req.user.id);
  const note = `New message in group "${group.name}" from ${req.user.full_name}`;
  const notifResults = await Promise.allSettled(
    recipients.map((uid) =>
      notificationService.createNotification({
        user_id: uid,
        type: "group_message",
        message: note,
      })
    )
  );
  notifResults.forEach((res, idx) => {
    if (res.status === "rejected") {
      logger.error(
        `Failed to create notification for user ${recipients[idx]}:`,
        res.reason,
      );
    }
  });

  const msgResults = await Promise.allSettled(
    recipients.map((uid) =>
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: uid,
        message: note,
      })
    )
  );
  msgResults.forEach((res, idx) => {
    if (res.status === "rejected") {
      logger.error(
        `Failed to create private message for user ${recipients[idx]}:`,
        res.reason,
      );
    }
  });

  const msgText = message
    ? `${req.user.full_name}: ${message}`
    : note;

  if (sendEmail === "true" || sendEmail === true) {
    const emailSubject = `New message in group "${group.name}"`;
    const emailResults = await Promise.allSettled(
      recipients.map((uid) =>
        messageService.sendEmail({
          sender_id: req.user.id,
          receiver_id: uid,
          subject: emailSubject,
          message: msgText,
        })
      )
    );
    emailResults.forEach((res, idx) => {
      if (res.status === "rejected") {
        logger.error(
          `Failed to send email to user ${recipients[idx]}:`,
          res.reason,
        );
      }
    });
  }

  if (sendWhatsapp === "true" || sendWhatsapp === true) {
    const waResults = await Promise.allSettled(
      recipients.map((uid) =>
        messageService.sendWhatsApp({
          sender_id: req.user.id,
          receiver_id: uid,
          message: msgText,
        })
      )
    );
    waResults.forEach((res, idx) => {
      if (res.status === "rejected") {
        logger.error(
          `Failed to send WhatsApp message to user ${recipients[idx]}:`,
          res.reason,
        );
      }
    });
  }

  sendSuccess(res, full, "Message sent");
});

exports.deleteMessage = catchAsync(async (req, res) => {
  const { id } = req.params;
  const deleted = await msgService.deleteMessage(req.user.id, id);
  if (!deleted) throw new AppError("Message not found", 404);
  sendSuccess(res, deleted, "Message deleted");
});


exports.updateTyping = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { typing } = req.body || {};
  await resolveGroupRole(id, req.user);
  if (!typingStatus.has(id)) typingStatus.set(id, new Map());
  const map = typingStatus.get(id);
  if (typing) {
    map.set(req.user.id, { name: req.user.full_name, ts: Date.now() });
  } else {
    map.delete(req.user.id);
  }
  sendSuccess(res, { ok: true });
});

exports.getTyping = catchAsync(async (req, res) => {
  const { id } = req.params;
  await resolveGroupRole(id, req.user);
  const map = typingStatus.get(id);
  if (!map) return sendSuccess(res, []);
  const now = Date.now();
  const names = [];
  for (const [uid, info] of map.entries()) {
    if (now - info.ts < 4000) {
      if (uid !== req.user.id) names.push(info.name);
    } else {
      map.delete(uid);
    }
  }
  sendSuccess(res, names);
});
