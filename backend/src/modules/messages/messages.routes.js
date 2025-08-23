const express = require("express");
const router = express.Router();
const controller = require("./messages.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const validate = require("../../middleware/validate");
const validator = require("./messages.validator");
const rateLimit = require("express-rate-limit");

// Limit messaging and call actions to prevent abuse
const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
});

router.use(verifyToken);

router.get("/", controller.getMyMessages);
router.patch("/:id/read", validate(validator.idParam), controller.markRead);
router.delete("/:id", validate(validator.idParam), controller.deleteMessage);
router.post(
  "/:id/email",
  messageLimiter,
  validate(validator.sendEmail),
  controller.sendEmail
);
router.post(
  "/:id/whatsapp",
  messageLimiter,
  validate(validator.sendWhatsApp),
  controller.sendWhatsApp
);
router.post(
  "/:id/video-call",
  validate(validator.startVideoCall),
  controller.startVideoCall
);
router.post(
  "/call/:id/respond",
  messageLimiter,
  validate(validator.respondVideoCall),
  controller.respondVideoCall
);
router.post(
  "/call/:id/end",
  validate(validator.endVideoCall),
  controller.endVideoCall
);

module.exports = router;
