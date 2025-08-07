const router = require("express").Router();
const controller = require("./book.controller");
const { verifyToken, isInstructor } = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isInstructor);

// GET /api/instructor/books
router.get("/", controller.listInstructorBooks);

module.exports = router;
