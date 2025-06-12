const express = require("express");
const router = express.Router();
const ctrl = require("./tutorialChapter.controller");
const { verifyToken, isInstructorOrAdmin } = require("../../../../middleware/auth/authMiddleware");

router.post("/", verifyToken, isInstructorOrAdmin, ctrl.createChapter);
router.patch("/:id", verifyToken, isInstructorOrAdmin, ctrl.updateChapter);
router.delete("/:id", verifyToken, isInstructorOrAdmin, ctrl.deleteChapter);
router.get("/tutorial/:tutorialId", ctrl.getChaptersByTutorial); // public
router.patch(
  "/tutorial/:tutorialId/reorder",
  verifyToken,
  isInstructorOrAdmin,
  ctrl.reorderChapters
);


module.exports = router;
