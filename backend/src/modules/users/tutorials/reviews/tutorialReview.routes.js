const router = require("express").Router();
const ctrl = require("./tutorialReview.controller");
const { verifyToken, isStudent } = require("../../../../middleware/auth/authMiddleware");

// POST /api/tutorials/reviews/:tutorialId
router.post("/:tutorialId", verifyToken, isStudent, ctrl.submitReview);

// GET /api/tutorials/reviews/:tutorialId
router.get("/:tutorialId", ctrl.getReviews);

module.exports = router;
