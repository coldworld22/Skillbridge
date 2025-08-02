const express = require("express");
const router = express.Router();
const controller = require("./messages.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

router.get("/", controller.getMyMessages);
router.patch("/:id/read", controller.markRead);
router.delete("/:id", controller.deleteMessage);
router.post("/:id/email", controller.sendEmail);
router.post("/:id/whatsapp", controller.sendWhatsApp);
router.post("/:id/video-call", controller.startVideoCall);

module.exports = router;
