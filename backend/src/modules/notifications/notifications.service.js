const db = require("../../config/database");
const logger = require("../../utils/logger.js");

exports.createNotification = async ({ user_id, type, message }) => {
  if (!user_id) {
    logger.warn("Skipping notification: missing user_id", { type, message });
    return null;
  }

  const userExists = await db("users").first("id").where({ id: user_id });
  if (!userExists) {
    logger.warn(
      `Skipping notification: user ${user_id} not found for type ${
        type || "unspecified"
      }`
    );
    return null;
  }

  try {
    const [row] = await db("notifications")
      .insert({ user_id, type, message, created_at: new Date() })
      .returning("*");
    return row;
  } catch (err) {
    if (err?.code === "23503") {
      logger.warn(
        `Skipping notification: foreign key violation for user ${user_id} and type ${
          type || "unspecified"
        }`
      );
      return null;
    }
    logger.error("Failed to create notification:", err);
    throw err;
  }
};

exports.getUserNotifications = async (userId) => {
  const threshold = new Date(Date.now() - 60 * 60 * 1000);
  // Cleanup read notifications older than an hour for this user
  // If system-wide deletion is needed, consider moving cleanup to a scheduled job
  await db("notifications")
    .where({ read: true, user_id: userId })
    .andWhere("read_at", "<", threshold)
    .del();
  return db("notifications")
    .where({ user_id: userId })
    .orderBy("created_at", "desc");
};

exports.markAsRead = async (id, userId) => {
  const [row] = await db("notifications")
    .where({ id, user_id: userId })
    .update({ read: true, read_at: new Date() })
    .returning("*");
  return row;
};

exports.deleteNotification = async (id, userId) => {
  const [row] = await db("notifications")
    .where({ id, user_id: userId })
    .del()
    .returning("*");
  return row;
};
