const router = require("express").Router();
const ctrl = require("./groups.controller");
const msgCtrl = require("./groupMessages.controller");
const { verifyToken } = require("../../middleware/auth/authMiddleware");
const upload = require("./groupUploadMiddleware");
const msgUpload = require("./groupMessageUpload.middleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../middleware/storage");

router.get("/tags", ctrl.listTags);
router.get(
  "/my",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.getMyGroups,
);
router.post(
  "/:id/join",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.joinGroup,
);
router.delete(
  "/:id/join",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.cancelJoin,
);
router.get(
  "/:id/members",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.listMembers,
);
router.post(
  "/:id/members/:memberId/manage",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("group.manage"),
  ctrl.manageMember,
);
router.get(
  "/:id/requests",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.listJoinRequests,
);
router.post(
  "/requests/:requestId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("group.manage"),
  ctrl.manageJoinRequest,
);
router.get(
  "/:id/permissions",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  ctrl.getGroupPermissions,
);
router.put(
  "/:id/permissions",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("group.manage"),
  ctrl.updateGroupPermissions,
);
router.get(
  "/:id/messages",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  msgCtrl.getMessages,
);
router.post(
  "/:id/messages",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("group.manage"),
  msgUpload,
  checkAndConsumeStorage(),
  msgCtrl.sendMessage,
);
router.delete(
  "/messages/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("group.manage"),
  msgCtrl.deleteMessage,
);

router.post("/:id/typing", verifyToken, msgCtrl.updateTyping);
router.get("/:id/typing", verifyToken, msgCtrl.getTyping);
router.post("/:id/video-call", verifyToken, ctrl.startVideoCall);

router.post("/:id/email", verifyToken, ctrl.sendEmail);

router.post(
  "/",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("group.create"),
  upload,
  checkAndConsumeStorage(),
  ctrl.createGroup,
);
router.get("/", ctrl.listGroups);
router.get("/:id", ctrl.getGroup);
router.patch(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("group.update"),
  upload,
  checkAndConsumeStorage(),
  ctrl.updateGroup,
);
router.delete(
  "/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("group.delete"),
  ctrl.deleteGroup,
);

module.exports = router;
