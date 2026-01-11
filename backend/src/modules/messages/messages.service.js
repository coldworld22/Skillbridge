const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const mailService = require("../../services/mailService");
const whatsappService = require("../../services/whatsappService");
const AppError = require("../../utils/AppError");

const MESSAGE_RETENTION_MS =
  parseInt(process.env.MESSAGE_RETENTION_HOURS || "24", 10) *
  60 *
  60 *
  1000;

let messageColumnInfoPromise;
const getMessageColumnInfo = async () => {
  if (!messageColumnInfoPromise) {
    messageColumnInfoPromise = Promise.all([
      db.schema.hasColumn("messages", "tenant_id"),
      db.schema.hasTable("tenant_memberships"),
      db.schema.hasTable("tenants"),
    ]).then(([hasTenantId, hasMemberships, hasTenants]) => ({
      hasTenantId,
      hasMemberships,
      hasTenants,
    }));
  }
  return messageColumnInfoPromise;
};

const resolveTenantId = async ({ tenant_id, sender_id, receiver_id }) => {
  if (tenant_id) return tenant_id;
  const { hasMemberships, hasTenants } = await getMessageColumnInfo();
  if (hasMemberships) {
    const senderMembership = await db("tenant_memberships")
      .select("tenant_id")
      .where({ user_id: sender_id })
      .orderBy("created_at", "asc")
      .first();
    if (senderMembership?.tenant_id) return senderMembership.tenant_id;

    const receiverMembership = await db("tenant_memberships")
      .select("tenant_id")
      .where({ user_id: receiver_id })
      .orderBy("created_at", "asc")
      .first();
    if (receiverMembership?.tenant_id) return receiverMembership.tenant_id;
  }

  if (hasTenants) {
    const fallback = await db("tenants")
      .select("id")
      .orderBy("created_at", "asc")
      .first();
    return fallback?.id || null;
  }

  return null;
};

exports.createMessage = async (
  {
    sender_id,
    receiver_id,
    message,
    booking_id = null,
    type = null,
    file_url = null,
    audio_url = null,
    reply_to_id = null,
    tenant_id = null,
  },
  trx = null,
  emit = true,
) => {
  if (!sender_id || !receiver_id) {
    logger.warn("Skipping message: missing sender or receiver", {
      sender_id,
      receiver_id,
      type,
    });
    return null;
  }

  const [senderExists, receiverExists] = await Promise.all([
    db("users").first("id").where({ id: sender_id }),
    db("users").first("id").where({ id: receiver_id }),
  ]);

  if (!senderExists) {
    logger.warn("Skipping message: sender not found", {
      sender_id,
      receiver_id,
      type,
    });
    return null;
  }

  if (!receiverExists) {
    logger.warn("Skipping message: receiver not found", {
      sender_id,
      receiver_id,
      type,
    });
    return null;
  }

  const payload = {
    sender_id,
    receiver_id,
    message,
    booking_id,
    type,
    file_url,
    audio_url,
    reply_to_id,
  };

  const { hasTenantId } = await getMessageColumnInfo();
  if (hasTenantId) {
    payload.tenant_id = await resolveTenantId({
      tenant_id,
      sender_id,
      receiver_id,
    });
    if (!payload.tenant_id) {
      logger.warn("Skipping message: tenant_id missing for scoped table", {
        sender_id,
        receiver_id,
        type,
      });
      return null;
    }
  } else if (payload.tenant_id !== undefined) {
    delete payload.tenant_id;
  }

  const run = async (transaction) => {
    const [row] = await transaction("messages")
      .insert(payload)
      .returning("*");
    try {
      if (emit && global.io && global.userSockets?.[receiver_id]) {
        global.io.to(global.userSockets[receiver_id]).emit("message-created");
      }
    } catch (err) {
      logger.error("Failed to emit message-created event", err.message);
      throw err;
    }
    return row;
  };

  try {
    if (trx) {
      return await run(trx);
    }
    return await db.transaction(async (transaction) => run(transaction));
  } catch (err) {
    if (err?.code === "23503") {
      logger.warn(
        `Skipping message: foreign key violation for sender ${sender_id} or receiver ${receiver_id}`,
        { type },
      );
      return null;
    }
    logger.error("Failed to create message", err.message);
    throw err;
  }
};

exports.getUserMessages = async (userId, { limit, offset } = {}) => {
  if (MESSAGE_RETENTION_MS > 0) {
    const threshold = new Date(Date.now() - MESSAGE_RETENTION_MS);
    await db("messages")
      .where({ receiver_id: userId, read: true })
      .andWhere("read_at", "<", threshold)
      .del();
  }

  const query = db("messages")
    .select("messages.*", "users.full_name as sender_name")
    .leftJoin("users", "messages.sender_id", "users.id")
    .where({ receiver_id: userId })
    .orderBy("sent_at", "desc");

  if (Number.isFinite(limit)) query.limit(limit);
  if (Number.isFinite(offset)) query.offset(offset);

  return query;
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

exports.sendEmail = async ({ sender_id, receiver_id, subject, message, quota }) =>
  db.transaction(async (trx) => {
    let quotaInfo = null;
    if (quota?.consume) {
      quotaInfo = await quota.consume(trx);
    }

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
      logger.error("Failed to send email", err.message);
      throw new AppError("Failed to send email", 502);
    }

    try {
      if (global.io && global.userSockets?.[receiver_id]) {
        global.io.to(global.userSockets[receiver_id]).emit("message-created");
      }
    } catch (err) {
      logger.error("Failed to emit message-created event", err.message);
      throw err;
    }

    if (quotaInfo && typeof quotaInfo.remaining !== "undefined") {
      msg.quota_remaining = quotaInfo.remaining;
    }

    return msg;
  });

exports.sendWhatsApp = async ({ sender_id, receiver_id, message, quota }) =>
  db.transaction(async (trx) => {
    let quotaInfo = null;
    if (quota?.consume) {
      quotaInfo = await quota.consume(trx);
    }

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
      logger.error("Failed to send WhatsApp message", err.message);
      throw new AppError("Failed to send WhatsApp message", 502);
    }

    try {
      if (global.io && global.userSockets?.[receiver_id]) {
        global.io.to(global.userSockets[receiver_id]).emit("message-created");
      }
    } catch (err) {
      logger.error("Failed to emit message-created event", err.message);
      throw err;
    }

    if (quotaInfo && typeof quotaInfo.remaining !== "undefined") {
      msg.quota_remaining = quotaInfo.remaining;
    }

    return msg;
  });

exports.startVideoCall = async ({ sender_id, receiver_id, quota }) => {
  let quotaInfo = null;
  const { call, roomId } = await db.transaction(async (trx) => {
    if (quota?.consume) {
      quotaInfo = await quota.consume(trx);
    }

    const sender = await trx("users")
      .select("id")
      .where({ id: sender_id })
      .first();
    const receiver = await trx("users")
      .select("id")
      .where({ id: receiver_id })
      .first();
    if (!sender || !receiver)
      throw new AppError("Invalid call participants", 400);

    const roomId = uuidv4();
    const [call] = await trx("video_calls")
      .insert({
        caller_id: sender_id,
        receiver_id,
        room_id: roomId,
      })
      .returning("*");

    await exports.createMessage(
      {
        sender_id,
        receiver_id,
        message: roomId,
        type: "video-call",
      },
      trx,
      false,
    );

    return { call, roomId };
  });

  try {
    if (global.io && global.userSockets?.[receiver_id]) {
      const caller = await db("users")
        .select("full_name")
        .where({ id: sender_id })
        .first();

      global.io.to(global.userSockets[receiver_id]).emit("message-created");

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
    logger.error("Failed to emit video call events", err);
  }

  const payload = { callId: call.id, roomId };
  if (quotaInfo && typeof quotaInfo.remaining !== "undefined") {
    payload.quota_remaining = quotaInfo.remaining;
  }
  return payload;
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
    logger.error("Failed to emit video-call-response", err);
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
    logger.error("Failed to emit video-call-ended", err);
  }
  return updated;
};
