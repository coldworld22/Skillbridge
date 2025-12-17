const router = require("express").Router();
const controller = require("./student.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.list);
router.post("/:id/email", verifyToken, controller.sendEmail);
router.post("/:id/whatsapp", verifyToken, controller.sendWhatsApp);
router.post("/:id/video-call", verifyToken, controller.startVideoCall);
router.get("/:id", controller.getById);

module.exports = router;
