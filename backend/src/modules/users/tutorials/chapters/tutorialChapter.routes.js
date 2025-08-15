const express = require("express");
const router = express.Router();
const ctrl = require("./tutorialChapter.controller");
const { verifyToken, isInstructorOrAdmin } = require("../../../../middleware/auth/authMiddleware");
const uploadChapterVideo = require("./uploadChapterVideo");

// Optional auth middleware: attaches user if token provided, otherwise continues
const optionalAuth = (req, res, next) => {
  const hasToken =
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) ||
    (req.cookies && req.cookies.token);
  if (hasToken) {
    return verifyToken(req, res, next);
  }
  return next();
};

// Upload chapter video
router.post(
  "/upload",
  verifyToken,
  isInstructorOrAdmin,
  uploadChapterVideo,
  ctrl.uploadVideo
);

router.post("/", verifyToken, isInstructorOrAdmin, ctrl.createChapter);
router.patch("/:id", verifyToken, isInstructorOrAdmin, ctrl.updateChapter);
router.delete("/:id", verifyToken, isInstructorOrAdmin, ctrl.deleteChapter);
router.get("/tutorial/:tutorialId", optionalAuth, ctrl.getChaptersByTutorial); // allow guest or enrolled
router.patch(
  "/tutorial/:tutorialId/reorder",
  verifyToken,
  isInstructorOrAdmin,
  ctrl.reorderChapters
);


module.exports = router;
