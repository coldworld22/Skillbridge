const express = require("express");
const router = express.Router();
const controller = require("./notifications.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const { isAdminRole } = require("../../utils/role");

const canCreateNotification = (req, res, next) => {
  const { user_id: targetUserId } = req.body || {};
  const roles = req.user?.roles || [req.user?.role];
  if (!targetUserId || targetUserId === req.user?.id || isAdminRole(roles)) {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
};

router.use(verifyToken);

router.get("/", controller.getMyNotifications);
router.post("/", canCreateNotification, controller.create);
router.patch("/:id/read", controller.markRead);
router.delete("/:id", controller.remove);

module.exports = router;
