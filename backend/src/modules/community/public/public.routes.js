const router = require("express").Router();
const ctrl = require("./public.controller");
const { verifyToken } = require("../../../middleware/auth/authMiddleware");
const upload = require("./discussionUpload.middleware");
const replyUpload = require("./replyUpload.middleware");

router.get("/discussions", ctrl.listDiscussions);
router.get("/discussions/:id", ctrl.getDiscussion);
router.post("/discussions", verifyToken, upload.array('image'), ctrl.createDiscussion);
router.get("/discussions/:id/replies", ctrl.listReplies);
router.post("/discussions/:id/replies", verifyToken, replyUpload, ctrl.createReply);
router.post("/discussions/:id/like", verifyToken, ctrl.likeDiscussion);
router.delete("/discussions/:id/like", verifyToken, ctrl.unlikeDiscussion);
router.post("/discussions/:id/vote", verifyToken, ctrl.voteDiscussion);
router.get("/contributors", ctrl.listContributors);
router.get("/tags", ctrl.listTags);

module.exports = router;
