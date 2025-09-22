const express = require("express");
const router = express.Router();
const controller = require("./notifications.controller");
const { verifyToken, isAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

router.get("/", controller.getMyNotifications);
router.post("/", isAdmin, controller.create);
router.patch("/:id/read", controller.markRead);
router.delete("/:id", controller.remove);

module.exports = router;
