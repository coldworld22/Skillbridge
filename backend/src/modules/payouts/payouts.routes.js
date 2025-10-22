const express = require("express");
const router = express.Router();
const controller = require("./payouts.controller");
const auth = require("../../middleware/auth/authMiddleware");
const { verifyToken, isAdmin } = auth;
const ensureInstructor =
  typeof auth.isInstructor === "function"
    ? auth.isInstructor
    : (_req, _res, next) => next();

// Instructor routes
router.post(
  "/request",
  verifyToken,
  ensureInstructor,
  controller.requestPayout
);

router.get(
  "/wallet",
  verifyToken,
  ensureInstructor,
  controller.getWallet
);

router.get(
  "/history",
  verifyToken,
  ensureInstructor,
  controller.getMyPayouts
);

// Admin-only routes for payout management
router.use(verifyToken, isAdmin);

router.post("/", controller.createPayout);
router.get("/", controller.getPayouts);
router.get("/:id", controller.getPayout);
router.patch("/:id", controller.updatePayout);
router.delete("/:id", controller.deletePayout);

module.exports = router;
