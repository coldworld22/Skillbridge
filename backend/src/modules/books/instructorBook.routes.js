const router = require("express").Router();
const controller = require("./book.controller");
const { verifyToken, isInstructorOrAdmin } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isInstructorOrAdmin);

router.get("/analytics", controller.getInstructorBookAnalytics);
router.get("/", controller.listInstructorBooks);

module.exports = router;
