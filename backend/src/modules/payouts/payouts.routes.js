const express = require("express");
const router = express.Router();
const controller = require("./payouts.controller");
const auth = require("../../middleware/auth/authMiddleware");

const ensureMiddleware = (maybeFn) =>
  typeof maybeFn === "function" ? maybeFn : (_req, _res, next) => next();

const verifyToken = ensureMiddleware(auth.verifyToken);
const isAdmin = ensureMiddleware(auth.isAdmin);
const isInstructor = ensureMiddleware(auth.isInstructor);

// Instructor routes
router.post(
  "/request",
  verifyToken,
  isInstructor,
  controller.requestPayout
);

router.get(
  "/wallet",
  verifyToken,
  isInstructor,
  controller.getWallet
);

router.get(
  "/history",
  verifyToken,
  isInstructor,
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
