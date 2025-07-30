const router = require("express").Router();
const ctrl = require("./public.controller");
const { verifyToken } = require("../../../middleware/auth/authMiddleware");
const upload = require("./discussionUpload.middleware");

router.get("/discussions", ctrl.listDiscussions);
router.get("/discussions/:id", ctrl.getDiscussion);
router.post("/discussions", verifyToken, upload, ctrl.createDiscussion);
router.get("/contributors", ctrl.listContributors);

module.exports = router;
