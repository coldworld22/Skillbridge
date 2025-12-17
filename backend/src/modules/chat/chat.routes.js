const express = require("express");
const router = express.Router();
const controller = require("./chat.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const upload = require("./chatUpload.middleware");
const validate = require("../../middleware/validate");
const validator = require("./chat.validator");

const mapFilesToBody = (req, _res, next) => {
  const file = req.files?.file?.[0];
  const audio = req.files?.audio?.[0];
  if (file) req.body.file = { mimetype: file.mimetype, size: file.size };
  if (audio) req.body.audio = { mimetype: audio.mimetype, size: audio.size };
  next();
};

router.use(verifyToken);

router.get("/users", controller.searchUsers);
router.post(
  "/moderation",
  validate(validator.logModerationEvent),
  controller.logModerationEvent
);
router.get("/:userId", controller.getConversation);
router.post(
  "/:userId",
  upload,
  mapFilesToBody,
  validate(validator.sendMessage),
  controller.sendMessage
);
router.delete("/messages/:id", controller.deleteMessage);
router.patch("/messages/:id/pin", controller.togglePin);

module.exports = router;
