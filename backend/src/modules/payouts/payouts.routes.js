const express = require("express");
const router = express.Router();
const controller = require("./payouts.controller");
const auth = require("../../middleware/auth/authMiddleware");
const { verifyToken, isAdmin } = auth;
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const ensureInstructor =
  typeof auth.isInstructor === "function"
    ? auth.isInstructor
    : (_req, _res, next) => next();

// Instructor routes
router.post(
  "/request",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("payout.request"),
  ensureInstructor,
  controller.requestPayout,
);

router.get(
  "/wallet",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ensureInstructor,
  controller.getWallet,
);

router.get(
  "/history",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ensureInstructor,
  controller.getMyPayouts,
);

// Admin-only routes for payout management
router.use(
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("payout.manage"),
  isAdmin,
);

router.post("/", controller.createPayout);
router.get("/", controller.getPayouts);
router.get("/:id", controller.getPayout);
router.patch("/:id", controller.updatePayout);
router.delete("/:id", controller.deletePayout);

module.exports = router;
