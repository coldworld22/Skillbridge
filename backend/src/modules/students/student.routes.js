const router = require("express").Router();
const controller = require("./student.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const validate = require("../../middleware/validate");
const msgValidator = require("../messages/messages.validator");

router.get("/", controller.list);
router.post(
  "/:id/email",
  verifyToken,
  validate(msgValidator.sendEmail),
  controller.sendEmail,
);
router.post(
  "/:id/whatsapp",
  verifyToken,
  validate(msgValidator.sendWhatsApp),
  controller.sendWhatsApp,
);
router.post("/:id/video-call", verifyToken, controller.startVideoCall);
router.get("/:id", controller.getById);

module.exports = router;
