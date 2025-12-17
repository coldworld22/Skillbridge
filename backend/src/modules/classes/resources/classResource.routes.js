const express = require("express");
const router = express.Router();
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../../middleware/auth/authMiddleware");
const verifyClassAccess = require("../../../middleware/auth/verifyClassAccess");
const verifyClassOwnership = require("../../../middleware/auth/verifyClassOwnership");
const controller = require("./classResource.controller");
const upload = require("./classResourceUpload");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../../middleware/storage");

router.get(
  "/class/:classId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  verifyClassAccess,
  controller.listByClass,
);

router.post(
  "/class/:classId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  verifyClassOwnership,
  upload.single("file"),
  checkAndConsumeStorage(),
  requireEntitlement("class.resource.manage"),
  controller.createResource,
);

router.delete(
  "/:resourceId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  requireEntitlement("class.resource.manage"),
  controller.deleteResource,
);

module.exports = router;
