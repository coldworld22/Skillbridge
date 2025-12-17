const logger = require('../../utils/logger.js');
const db = require("../../config/database");
const { isAdminRole } = require("../../utils/role");
const ensureVideoCallSchema = require("../../utils/ensureVideoCallSchema");

module.exports = async function verifyVideoCallAccess(req, res, next) {
  const roomId = req.params.roomId;
  if (!roomId) {
    return res.status(400).json({ message: "Room id required" });
  }

  try {
    await ensureVideoCallSchema();
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
      .whereNull("left_at")
      .first();

    if (participant) {
      return next();
    }

    const cls = await db("online_classes")
      .select("instructor_id")
      .where({ id: roomId })
      .first();
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }
    if (cls.instructor_id === req.user.id || isAdmin) {
      return next();
    }
    const enrollment = await db("class_enrollments")
      .select("status")
      .where({ class_id: roomId, user_id: req.user.id })
      .first();
    if (enrollment) {
      if (enrollment.status === "suspended") {
        return res
          .status(403)
          .json({ message: "Enrollment suspended pending installment payment" });
      }
      if (enrollment.status !== "cancelled") {
        return next();
      }
    }

    return res.status(403).json({ message: "Not allowed" });
  } catch (err) {
    logger.error("Failed to verify video call access", err);
    return res.status(500).json({ message: "Failed to verify video call access" });
  }
};
