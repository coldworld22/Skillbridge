const router = require("express").Router();
const controller = require("./book.controller");
const { verifyToken, isInstructorOrAdmin } = require("../../middleware/auth/authMiddleware");

router.get("/", verifyToken, isInstructorOrAdmin, controller.listInstructorBooks);
router.get("/analytics", verifyToken, isInstructorOrAdmin, controller.getBookAnalytics);

module.exports = router;
