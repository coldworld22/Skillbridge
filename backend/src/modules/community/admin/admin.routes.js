const express = require("express");
const router = express.Router();
const controller = require("./admin.controller");
const { verifyToken, isAdmin } = require("../../../middleware/auth/authMiddleware");

router.use(verifyToken, isAdmin);

router.get("/discussions", controller.getDiscussions);
router.get("/discussions/:id", controller.getDiscussion);
router.delete("/discussions/:id", controller.deleteDiscussion);
router.patch("/discussions/:id/lock", controller.lockDiscussion);
router.patch("/discussions/:id/unlock", controller.unlockDiscussion);

module.exports = router;
