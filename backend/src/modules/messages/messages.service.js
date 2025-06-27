const db = require("../../config/database");

exports.createMessage = async ({ sender_id, receiver_id, message, booking_id }) => {
  const [row] = await db("messages")
    .insert({ sender_id, receiver_id, message, booking_id })
    .returning("*");
  return row;
};

exports.getUserMessages = async (userId) => {
  const threshold = new Date(Date.now() - 60 * 60 * 1000);
  await db("messages")
    .where({ receiver_id: userId, read: true })
    .andWhere("read_at", "<", threshold)
    .del();

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
