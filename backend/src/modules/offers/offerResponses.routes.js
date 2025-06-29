const router = require("express").Router({ mergeParams: true });
const controller = require("./offerResponses.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken);

router.post("/", controller.createResponse);
router.get("/", controller.listResponses);

router.get("/:responseId/messages", controller.getMessages);
router.post("/:responseId/messages", controller.sendMessage);

module.exports = router;
