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
});

router.use(verifyToken);

router.get("/", controller.getMyMessages);
router.patch("/:id/read", controller.markRead);
router.delete("/:id", controller.deleteMessage);
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
  messageLimiter,
  controller.startVideoCall
);
router.post(
  "/call/:id/respond",
  messageLimiter,
  validate(validator.respondVideoCall),
  controller.respondVideoCall
);
router.post("/call/:id/end", messageLimiter, controller.endVideoCall);

module.exports = router;
