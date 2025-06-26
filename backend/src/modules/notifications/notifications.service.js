const db = require("../../config/database");

exports.createNotification = async ({ user_id, type, message }) => {
  const [row] = await db("notifications")
    .insert({ user_id, type, message, created_at: new Date() })
    .returning("*");
  return row;
};

exports.getUserNotifications = (userId) => {
  return db("notifications").where({ user_id: userId }).orderBy("created_at", "desc");
};

exports.markAsRead = async (id, userId) => {
  const [row] = await db("notifications")
    .where({ id, user_id: userId })
    .update({ read: true, read_at: new Date() })
    .returning("*");
  return row;
};
