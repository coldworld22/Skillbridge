const router = require("express").Router();
const controller = require("./instructor.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.list);
router.post("/:id/email", verifyToken, controller.sendEmail);
router.post("/:id/whatsapp", verifyToken, controller.sendWhatsApp);
router.post("/:id/video-call", verifyToken, controller.startVideoCall);
// More specific routes should be defined before parameterized ones
router.get("/:id/availability", controller.getAvailability);
router.get("/:id", controller.getById);

module.exports = router;
