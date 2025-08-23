const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const mailService = require("../../services/mailService");
const whatsappService = require("../../services/whatsappService");
const AppError = require("../../utils/AppError");

const emitMessageCreated = (receiver_id) => {
  try {
    if (global.io && global.userSockets?.[receiver_id]) {
      global.io.to(global.userSockets[receiver_id]).emit("message-created");
    }
  } catch (err) {
    console.error("Failed to emit message-created event", err.message);
    throw err;
  }
};

exports.createMessage = async (
  { sender_id, receiver_id, message, booking_id, type },
  trx = null,
  emit = true,
) => {
  const run = async (transaction) => {
    const [row] = await transaction("messages")
      .insert({ sender_id, receiver_id, message, booking_id, type })
      .returning("*");
    if (emit) emitMessageCreated(receiver_id);
    return row;
  };

  try {
    if (trx) {
      return await run(trx);
    }
    return await db.transaction(async (transaction) => run(transaction));
  } catch (err) {
    console.error("Failed to create message", err.message);
    throw err;
  }
};

exports.getUserMessages = async (userId) => {
  const retentionHours = parseInt(
    process.env.MESSAGE_RETENTION_HOURS || "24",
    10,
  );
  if (retentionHours > 0) {
    const threshold = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
    await db("messages")
      .where({ receiver_id: userId, read: true })
      .andWhere("read_at", "<", threshold)
      .del();
  }

  return db("messages")
    .select("messages.*", "users.full_name as sender_name")
    .leftJoin("users", "messages.sender_id", "users.id")
    .where({ receiver_id: userId })
    .orderBy("sent_at", "desc");
};

exports.markAsRead = async (id, userId) => {
  const [row] = await db("messages")
    .where({ id, receiver_id: userId })
    .update({ read: true, read_at: new Date() })
    .returning("*");
  return row;
};

exports.deleteMessage = async (userId, id) => {
  const [row] = await db("messages")
    .where({ id })
    .andWhere(function () {
      this.where({ sender_id: userId }).orWhere({ receiver_id: userId });
    })
    .del()
    .returning("*");
  return row;
};

exports.sendEmail = async ({ sender_id, receiver_id, subject, message }) =>
  db.transaction(async (trx) => {
    const user = await trx("users")
      .select("email")
      .where({ id: receiver_id })
      .first();
    if (!user) throw new AppError("User not found", 404);

    const msg = await exports.createMessage(
      { sender_id, receiver_id, message },
      trx,
      false,
    );

    try {
      await mailService.sendMail({ to: user.email, subject, html: message });
    } catch (err) {
      console.error("Failed to send email", err.message);
      throw new AppError("Failed to send email", 502);
    }
    emitMessageCreated(receiver_id);

    return msg;
  });

exports.sendWhatsApp = async ({ sender_id, receiver_id, message }) =>
  db.transaction(async (trx) => {
    const user = await trx("users")
      .select("phone")
      .where({ id: receiver_id })
      .first();
    if (!user || !user.phone) throw new AppError("User phone not found", 404);

    const msg = await exports.createMessage(
      { sender_id, receiver_id, message },
      trx,
      false,
    );

    try {
      await whatsappService.sendWhatsApp({ to: user.phone, message });
    } catch (err) {
      console.error("Failed to send WhatsApp message", err.message);
      throw new AppError("Failed to send WhatsApp message", 502);
    }
    emitMessageCreated(receiver_id);

    return msg;
  });

exports.startVideoCall = async ({ sender_id, receiver_id }) => {
  const sender = await db("users")
    .select("id")
    .where({ id: sender_id })
    .first();
  const receiver = await db("users")
    .select("id")
    .where({ id: receiver_id })
    .first();
  if (!sender || !receiver) throw new AppError("Invalid call participants", 400);

  const roomId = uuidv4();
  const [call] = await db("video_calls")
    .insert({
      caller_id: sender_id,
      receiver_id,
      room_id: roomId,
    })
    .returning("*");

  await exports.createMessage({
    sender_id,
    receiver_id,
    message: roomId,
    type: "video-call",
  });

  try {
    if (global.io && global.userSockets?.[receiver_id]) {
      const caller = await db("users")
        .select("full_name")
        .where({ id: sender_id })
        .first();

      // Emit legacy event for compatibility
      global.io
        .to(global.userSockets[receiver_id])
        .emit("video-call-invite", { callId: call.id, roomId });

      // Emit incoming-call event used by the frontend call overlay
      global.io
        .to(global.userSockets[receiver_id])
        .emit("incoming-call", {
          chatId: sender_id,
          roomId,
          name: caller?.full_name || "",
        });
    }
  } catch (err) {
    console.error("Failed to emit video call events", err);
  }

  return { callId: call.id, roomId };
};

exports.respondVideoCall = async ({ call_id, user_id, action }) => {
  const call = await db("video_calls").where({ id: call_id }).first();
  if (!call || call.receiver_id !== user_id)
    throw new AppError("Call not found", 404);
  const status = action === "accept" ? "accepted" : "declined";
  const [updated] = await db("video_calls")
    .where({ id: call_id })
    .update({ status })
    .returning("*");
  try {
    if (global.io && global.userSockets?.[call.caller_id]) {
      global.io
        .to(global.userSockets[call.caller_id])
        .emit("video-call-response", { callId: call_id, status });
    }
  } catch (err) {
    console.error("Failed to emit video-call-response", err);
  }
  return updated;
};

exports.endVideoCall = async ({ call_id, user_id }) => {
  const call = await db("video_calls").where({ id: call_id }).first();
  if (!call || (call.caller_id !== user_id && call.receiver_id !== user_id))
    throw new AppError("Call not found", 404);
  const [updated] = await db("video_calls")
    .where({ id: call_id })
    .update({ status: "ended", ended_at: new Date() })
    .returning("*");
  try {
    if (global.io) {
      const sockets = [];
      if (global.userSockets?.[call.caller_id])
        sockets.push(global.userSockets[call.caller_id]);
      if (global.userSockets?.[call.receiver_id])
        sockets.push(global.userSockets[call.receiver_id]);
      sockets.forEach((sid) =>
        global.io.to(sid).emit("video-call-ended", { callId: call_id }),
      );
    }
  } catch (err) {
    console.error("Failed to emit video-call-ended", err);
  }
  return updated;
};
