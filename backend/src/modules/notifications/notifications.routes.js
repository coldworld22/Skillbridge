const express = require("express");
const router = express.Router();
const controller = require("./notifications.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
} = require("../../middleware/tenant");

router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
);

router.get("/", controller.getMyNotifications);
router.post("/", controller.create);
router.patch("/:id/read", controller.markRead);
router.delete("/:id", controller.remove);

module.exports = router;
