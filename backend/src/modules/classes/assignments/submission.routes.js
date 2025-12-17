const router = require("express").Router();
const ctrl = require("./submission.controller");
const {
  verifyToken,
  isStudent,
  isInstructorOrAdmin,
} = require("../../../middleware/auth/authMiddleware");
const verifyAssignmentOwnership = require("../../../middleware/auth/verifyAssignmentOwnership");
const verifySubmissionOwnership = require("../../../middleware/auth/verifySubmissionOwnership");
const {
  assignmentSubmissionUpload,
} = require("./submissionUpload.middleware");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../../middleware/tenant");
const { checkAndConsumeStorage } = require("../../../middleware/storage");

const handleFileUpload = (req, res, next) => {
  if (!req.is("multipart/form-data")) {
    return next();
  }
  return assignmentSubmissionUpload.single("file")(req, res, (err) => {
    if (err) {
      return res
        .status(400)
        .json({ message: err.message || "Failed to upload file" });
    }
    return next();
  });
};

router.get(
  "/assignment/:assignmentId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  verifyAssignmentOwnership,
  ctrl.getByAssignment
);
router.post(
  "/assignment/:assignmentId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("class.create"),
  isStudent,
  handleFileUpload,
  checkAndConsumeStorage(),
  ctrl.createSubmission
);
router.put(
  "/:submissionId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("class.update"),
  isInstructorOrAdmin,
  verifySubmissionOwnership,
  ctrl.updateSubmission
);
router.delete(
  "/:submissionId",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  requireEntitlement("class.update"),
  isInstructorOrAdmin,
  verifySubmissionOwnership,
  ctrl.deleteSubmission
);

module.exports = router;
