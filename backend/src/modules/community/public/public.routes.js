const router = require("express").Router();
const ctrl = require("./public.controller");
const { verifyToken } = require("../../../middleware/auth/authMiddleware");
const upload = require("./discussionUpload.middleware");
const replyUpload = require("./replyUpload.middleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");

router.get("/discussions", ctrl.listDiscussions);
router.get("/discussions/:id", ctrl.getDiscussion);
router.post(
  "/discussions",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("community.discussion.create"),
  upload.array("image"),
  ctrl.createDiscussion,
);
router.get("/discussions/:id/replies", ctrl.listReplies);
router.post(
  "/discussions/:id/replies",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("community.reply.create"),
  replyUpload,
  ctrl.createReply,
);
router.post(
  "/discussions/:id/like",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.likeDiscussion,
);
router.delete(
  "/discussions/:id/like",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.unlikeDiscussion,
);
router.post(
  "/discussions/:id/vote",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.voteDiscussion,
);
router.get("/contributors", ctrl.listContributors);
router.get("/tags", ctrl.listTags);

module.exports = router;
