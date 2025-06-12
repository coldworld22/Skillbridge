const router = require("express").Router();
const ctrl = require("./tutorialComment.controller");
const { verifyToken, isStudent } = require("../../../middleware/authMiddleware");

router.post("/:tutorialId", verifyToken, isStudent, ctrl.createComment);
router.get("/:tutorialId", ctrl.getComments);

module.exports = router;
