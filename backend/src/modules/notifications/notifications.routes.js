const express = require("express");
const router = express.Router();
const controller = require("./notifications.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

router.get("/", controller.getMyNotifications);
router.post("/", controller.create);
router.patch("/:id/read", controller.markRead);

module.exports = router;
