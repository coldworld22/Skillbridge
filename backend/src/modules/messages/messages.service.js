const db = require("../../config/database");
const { v4: uuidv4 } = require("uuid");
const mailService = require("../../services/mailService");
const whatsappService = require("../../services/whatsappService");

exports.createMessage = async ({
  sender_id,
  receiver_id,
  message,
  booking_id,
  type,
}) => {
  const [row] = await db("messages")
    .insert({ sender_id, receiver_id, message, booking_id, type })
    .returning("*");
  try {
    if (global.io && global.userSockets?.[receiver_id]) {
      global.io.to(global.userSockets[receiver_id]).emit("message-created");
    }
  } catch (err) {
    console.error("Failed to emit message-created event", err);
  }
  return row;
};

exports.getUserMessages = async (userId) => {
  const retentionHours = parseInt(
    process.env.MESSAGE_RETENTION_HOURS || "1",
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

exports.sendEmail = async ({ sender_id, receiver_id, subject, message }) => {
  const user = await db("users").select("email").where({ id: receiver_id }).first();
  if (!user) throw new Error("User not found");
  await mailService.sendMail({ to: user.email, subject, html: message });
  return exports.createMessage({ sender_id, receiver_id, message });
};

exports.sendWhatsApp = async ({ sender_id, receiver_id, message }) => {
  const user = await db("users").select("phone").where({ id: receiver_id }).first();
  if (!user || !user.phone) throw new Error("User phone not found");
  await whatsappService.sendWhatsApp({ to: user.phone, message });
  return exports.createMessage({ sender_id, receiver_id, message });
};

exports.startVideoCall = async ({ sender_id, receiver_id }) => {
  const sender = await db("users")
    .select("id")
    .where({ id: sender_id })
    .first();
  const receiver = await db("users")
    .select("id")
    .where({ id: receiver_id })
    .first();
  if (!sender || !receiver) throw new Error("Invalid call participants");

  const roomId = uuidv4();
  await exports.createMessage({
    sender_id,
    receiver_id,
    message: roomId,
    type: "video-call",
  });
  return { roomId };
};
