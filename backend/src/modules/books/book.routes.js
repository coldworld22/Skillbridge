const router = require("express").Router();
const controller = require("./book.controller");
const { verifyToken, isInstructor } = require("../../middleware/auth/authMiddleware");

router.get("/", controller.listBooks);
router.get("/:id", controller.getBook);
router.post("/", verifyToken, isInstructor, controller.createBook);

module.exports = router;
