const router = require("express").Router();
const ctrl = require("./submission.controller");
const {
  verifyToken,
  isStudent,
} = require("../../../../middleware/auth/authMiddleware");
const {
  assignmentSubmissionUpload,
} = require("../../../classes/assignments/submissionUpload.middleware");

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

router.get("/assignment/:assignmentId", verifyToken, isStudent, ctrl.getMySubmission);
router.post(
  "/assignment/:assignmentId",
  verifyToken,
  isStudent,
  handleFileUpload,
  ctrl.createSubmission
);
router.put(
  "/:submissionId",
  verifyToken,
  isStudent,
  handleFileUpload,
  ctrl.updateSubmission
);

module.exports = router;
