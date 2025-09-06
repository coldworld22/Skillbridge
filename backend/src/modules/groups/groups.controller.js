const logger = require('../../utils/logger.js');
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./groups.service");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/AppError");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const mailService = require("../../services/mailService");
const whatsappService = require("../../services/whatsappService");
const { frontendBase } = require("../../utils/frontend");
const db = require("../../config/database");
const planService = require("../plans/plans.service");
const { parsePlanFeatures } = require("../../utils/planFeatures");

exports.createGroup = catchAsync(async (req, res) => {
  const planId =
    req.user.plan_id ||
    req.user.plan?.id ||
    req.user.subscription?.plan_id;
  const plan = planId ? await planService.getPlanById(planId) : null;
  const features = parsePlanFeatures(plan);
  if (!features["groups_create"]) {
    throw new AppError("Upgrade plan to create more groups", 403);
  }

  const {
    name,
    description,
    visibility,
    requires_approval,
    category_id,
    max_size,
    timezone,
    invited_users,
    invite_methods,
  } = req.body;
  if (await service.findByName(name)) {
    throw new AppError("Group name already exists", 409);
  }
  const group = await service.createGroup({
    id: uuidv4(),
    creator_id: req.user.id,
    name,
    description,
    visibility: visibility || "public",
    requires_approval: requires_approval || false,
    cover_image: req.file ? `/uploads/groups/${req.file.filename}` : undefined,
    category_id: category_id || null,
    max_size: max_size || null,
    timezone: timezone || null,
    status: "pending",
  });
  if (req.body.tags) {
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : JSON.parse(req.body.tags);
    await service.syncGroupTags(group.id, tags);
  }
  await service.addMember(group.id, req.user.id, "admin");

  const inviteUserIds = invited_users
    ? Array.isArray(invited_users)
      ? invited_users
      : JSON.parse(invited_users)
    : [];
  const inviteMethods = invite_methods
    ? Array.isArray(invite_methods)
      ? invite_methods
      : JSON.parse(invite_methods)
    : [];

  if (visibility === "private" && inviteUserIds.length) {
    const inviteMsg = `${req.user.full_name} invited you to join the group "${name}".`;

    for (const uid of inviteUserIds) {
      const contact = await userModel.findContactInfo(uid);
      if (!contact) continue;

      const role = (contact.role || "").toLowerCase();

      const rolePath =
        role === "instructor"
          ? "instructor"
          : role === "student"
            ? "student"
            : "admin";
      // Use configured frontend URL or default to localhost for dev
      const host = frontendBase;
      const groupLink = `${host}/dashboard/${rolePath}/groups/${group.id}`;

      const inviteLinkMsg = `${inviteMsg} ${groupLink}`;

      await Promise.all([
        notificationService.createNotification({
          user_id: uid,
          type: "group_invite",
          message: inviteLinkMsg,
        }),
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: uid,
          message: inviteLinkMsg,
        }),
      ]);
      if (inviteMethods.includes("email") && contact.email) {
        await mailService.sendMail({
          to: contact.email,
          subject: "Group Invitation",
          html: `<p>${inviteMsg}</p><p><a href="${groupLink}">Join Group</a></p>`,
        });
      }
      if (inviteMethods.includes("whatsapp") && contact.phone) {
        await whatsappService.sendWhatsApp({
          to: contact.phone,
          message: inviteLinkMsg,
        });
      }
    }
  } else {
    const students = await userModel.findStudents();
    const instructors = await userModel.findInstructors();
    const admins = await userModel.findAdmins();
    const recipients = [...students, ...instructors, ...admins].filter(
      (u) => u.id !== req.user.id,
    );
    const message = `${req.user.full_name} created a new group "${name}"`;

    await Promise.all([
      ...recipients.map((u) =>
        notificationService.createNotification({
          user_id: u.id,
          type: "group_created",
          message,
        }),
      ),
      ...recipients.map((u) =>
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: u.id,
          message,
        }),
      ),
    ]);
  }

  const full = await service.getGroupById(group.id);
  sendSuccess(res, full, "Group created");
});

exports.listGroups = catchAsync(async (req, res) => {
  const { search, status = "all" } = req.query;
  const data = await service.listGroups({ search, status });
  sendSuccess(res, data);
});

exports.getGroup = catchAsync(async (req, res) => {
  const group = await service.getGroupById(req.params.id);
  if (!group) {
    throw new AppError("Group not found", 404);
  }
  sendSuccess(res, group);
});

exports.updateGroup = catchAsync(async (req, res) => {
  const existing = await service.getGroupById(req.params.id);
  if (!existing) throw new AppError("Group not found", 404);

  const data = { ...req.body };
  if (
    data.status &&
    !["active", "inactive", "suspended", "pending"].includes(data.status)
  ) {
    throw new AppError("Invalid status", 400);
  }

  if (req.file) data.cover_image = `/uploads/groups/${req.file.filename}`;
  const updated = await service.updateGroup(req.params.id, data);

  if (req.body.tags) {
    const tags = Array.isArray(req.body.tags)
      ? req.body.tags
      : JSON.parse(req.body.tags);
    await service.syncGroupTags(req.params.id, tags);
  }

  if (data.status && data.status !== existing.status) {
    const msg = `Your group "${existing.name}" status changed to ${data.status}`;
    await Promise.all([
      notificationService.createNotification({
        user_id: existing.creator_id,
        type: "group_status",
        message: msg,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: existing.creator_id,
        message: msg,
      }),
    ]);
  }

  sendSuccess(res, updated);
});

exports.deleteGroup = catchAsync(async (req, res) => {
  const existing = await service.getGroupById(req.params.id);
  await service.deleteGroup(req.params.id);

  if (existing) {
    const msg = `Your group "${existing.name}" has been deleted`;
    await Promise.all([
      notificationService.createNotification({
        user_id: existing.creator_id,
        type: "group_deleted",
        message: msg,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: existing.creator_id,
        message: msg,
      }),
    ]);
  }

  sendSuccess(res, null, "Deleted");
});

exports.getMyGroups = catchAsync(async (req, res) => {
  const data = await service.getUserGroups(req.user.id);
  sendSuccess(res, data);
});

exports.joinGroup = catchAsync(async (req, res) => {
  const groupId = req.params.id;
  const group = await service.getGroupById(groupId);
  if (!group) throw new AppError("Group not found", 404);

  const existingRole = await service.getMemberRole(groupId, req.user.id);
  if (!existingRole) {
    const planId =
      req.user.plan_id ||
      req.user.plan?.id ||
      req.user.subscription?.plan_id;
    const plan = planId ? await planService.getPlanById(planId) : null;
    const features = parsePlanFeatures(plan);
    const joinLimit = features["groups_join_limit"];
    if (joinLimit && joinLimit !== "unlimited") {
      const limitNum = Number(joinLimit);
      if (!isNaN(limitNum)) {
        const count = await service.countUserGroups(req.user.id);
        if (count >= limitNum) {
          throw new AppError("Upgrade plan to join more groups", 403);
        }
      }
    }
  }

  if (group.requires_approval) {
    const reqRow = await service.requestJoin(groupId, req.user.id);

    const adminIds = await service.listAdminIds(groupId);
    const note = `${req.user.full_name} requested to join the group "${group.name}"`;

    const recipients = adminIds.filter((uid) => uid !== req.user.id);
    await Promise.all(
      recipients.map((uid) =>
        notificationService.createNotification({
          user_id: uid,
          type: "join_request",
          message: note,
        })
      )
    );
    await Promise.all(
      recipients.map((uid) =>
        messageService.createMessage({
          sender_id: req.user.id,
          receiver_id: uid,
          message: note,
        })
      )
    );

    sendSuccess(res, reqRow, "Request sent");
  } else {
    const member = await service.addMember(groupId, req.user.id, "member");
    sendSuccess(res, member, "Joined group");
  }
});

exports.cancelJoin = catchAsync(async (req, res) => {
  const groupId = req.params.id;
  await service.cancelJoinRequest(groupId, req.user.id);
  sendSuccess(res, null, "Request cancelled");
});

exports.listTags = catchAsync(async (_req, res) => {
  const data = await service.listTags();
  sendSuccess(res, data);
});
exports.listMembers = catchAsync(async (req, res) => {
  const members = await service.listMembers(req.params.id);
  sendSuccess(res, members);
});

exports.sendEmail = catchAsync(async (req, res) => {
  const { id } = req.params;
  const group = await service.getGroupById(id);
  if (!group) throw new AppError("Group not found", 404);
  const members = await service.listMembers(id);
  await Promise.all(
    members
      .filter((m) => m.user_id !== req.user.id)
      .map((m) =>
        messageService.sendEmail({
          sender_id: req.user.id,
          receiver_id: m.user_id,
          subject: req.body.subject,
          message: req.body.message,
        })
      )
  );
  sendSuccess(res, null, "Email sent");
});

exports.manageMember = catchAsync(async (req, res) => {
  const { memberId } = req.params;
  const { action } = req.body;
  const groupId = req.params.id;

  const role = await service.getMemberRole(groupId, req.user.id);
  if (!role || !["admin", "moderator"].includes(role)) {
    throw new AppError("Forbidden", 403);
  }

  if (role === "moderator") {
    const targetRole = await service.getMemberRole(groupId, memberId);
    if (targetRole === "admin") {
      throw new AppError("Cannot manage admin", 403);
    }
  }

  const result = await service.manageMember(groupId, memberId, action);
  sendSuccess(res, result);
});

exports.listJoinRequests = catchAsync(async (req, res) => {
  const requests = await service.listJoinRequests(req.params.id);
  sendSuccess(res, requests);
});

exports.manageJoinRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;
  if (!["approve", "reject"].includes(action)) {
    throw new AppError("Invalid action", 400);
  }
  const result = await service.manageJoinRequest(requestId, action);
  if (result) {
    const group = await service.getGroupById(result.group_id);
    const note =
      action === "approve"
        ? `Your request to join "${group.name}" was approved`
        : `Your request to join "${group.name}" was rejected`;
    await notificationService.createNotification({
      user_id: result.user_id,
      type: "join_request_" + action,
      message: note,
    });
    await messageService.createMessage({
      sender_id: req.user.id,
      receiver_id: result.user_id,
      message: note,
    });
  }
  sendSuccess(res, result);
});

exports.getGroupPermissions = catchAsync(async (req, res) => {
  const perms = await service.getGroupPermissions(req.params.id);
  sendSuccess(res, perms);
});

exports.updateGroupPermissions = catchAsync(async (req, res) => {
  const perms = await service.updateGroupPermissions(req.params.id, req.body);
  sendSuccess(res, perms);
});

exports.startVideoCall = catchAsync(async (req, res) => {
  const { id } = req.params;
  const group = await service.getGroupById(id);
  if (!group) throw new AppError("Group not found", 404);

  const role = await service.getMemberRole(id, req.user.id);
  if (!role) throw new AppError("Not authorized", 403);

  const perms = await service.getGroupPermissions(id);
  const rolePerms = perms[role] || {};
  if (!rolePerms.video) throw new AppError("Not authorized", 403);

  const members = await service.listMembers(id);
  const recipients = members
    .map((m) => m.user_id)
    .filter((uid) => uid !== req.user.id);

  const roomId = uuidv4();

  const note = `${req.user.full_name} started a video call in group "${group.name}"`;

  await Promise.all(
    recipients.map(async (uid) => {
      await db("video_calls").insert({
        caller_id: req.user.id,
        receiver_id: uid,
        room_id: roomId,
      });

      await messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: uid,
        message: roomId,
        type: "video-call",
      });

      await notificationService.createNotification({
        user_id: uid,
        type: "group_video_call",
        message: note,
      });

      try {
        if (global.io && global.userSockets?.[uid]) {
          global.io
            .to(global.userSockets[uid])
            .emit("incoming-call", {
              chatId: id,
              roomId,
              name: req.user.full_name,
            });
        }
      } catch (err) {
        logger.error("Failed to emit video call event", err.message);
      }
    })
  );

  sendSuccess(res, { roomId }, "Video call started");
});
