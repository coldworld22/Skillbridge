const express = require("express");
const router = express.Router();
const controller = require("./chat.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

router.get("/users", controller.searchUsers);
router.get("/:userId", controller.getConversation);
router.post("/:userId", controller.sendMessage);

module.exports = router;
