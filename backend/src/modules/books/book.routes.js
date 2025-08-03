const router = require("express").Router();
const controller = require("./book.controller");
const tagController = require("./bookTag.controller");
const { verifyToken, isInstructor } = require("../../middleware/auth/authMiddleware");

router.get("/tags", verifyToken, isInstructor, tagController.listTags);
router.post("/tags", verifyToken, isInstructor, tagController.createTag);
router.get("/", controller.listBooks);
router.get("/:id", controller.getBook);
router.post("/", verifyToken, isInstructor, controller.createBook);

module.exports = router;
