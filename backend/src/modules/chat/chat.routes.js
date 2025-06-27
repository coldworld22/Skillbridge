const express = require("express");
const router = express.Router();
const controller = require("./chat.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const upload = require("./chatUpload.middleware");

router.use(verifyToken);

router.get("/users", controller.searchUsers);
router.get("/:userId", controller.getConversation);
router.post("/:userId", upload, controller.sendMessage);

module.exports = router;
