const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const { isAdminRole } = require("../../utils/role");

module.exports = async function verifyVideoCallAccess(req, res, next) {
  const roomId = req.params.roomId;
  if (!roomId) {
    return res.status(400).json({ message: "Room id required" });
  }

  try {
    const roles = req.user.roles || [req.user.role];
    const isAdmin = isAdminRole(roles);

    const call = await db("video_calls")
      .select("caller_id", "receiver_id")
      .where({ room_id: roomId })
      .orderBy("started_at", "desc")
      .first();

    const isCallParticipant =
      call && (call.caller_id === req.user.id || call.receiver_id === req.user.id);

    if (isAdmin || isCallParticipant) {
      return next();
    }

    const candidateName =
      req.user.full_name || req.user.name || req.user.email || null;

    if (!candidateName) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const participant = await db("video_call_participants")
      .select("id")
      .where({ room_id: roomId, name: candidateName })
      .andWhereNull("left_at")
      .first();

    if (participant) {
      return next();
    }

    return res.status(403).json({ message: "Not allowed" });
  } catch (err) {
    logger.error("Failed to verify video call access", err);
    return res.status(500).json({ message: "Failed to verify video call access" });
  }
};
