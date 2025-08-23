const logger = require('../../utils/logger.js');
const db = require("../../config/database");

module.exports = async function verifyHostRole(req, res, next) {
  const { roomId } = req.params;
  try {
    const socketId = global.userSockets?.[req.user.id];
    if (!socketId)
      return res.status(403).json({ message: "Not allowed" });
    const participant = await db("video_call_participants")
      .select("role")
      .where({ room_id: roomId, socket_id: socketId })
      .andWhere("left_at", null)
      .first();
    if (!participant || participant.role !== "host") {
      return res.status(403).json({ message: "Not allowed" });
    }
    next();
  } catch (err) {
    logger.error("Failed to verify host role", err);
    res.status(500).json({ message: "Failed to verify host role" });
  }
};
