const router = require("express").Router();
const controller = require("./book.controller");
const tagController = require("./bookTag.controller");
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../middleware/auth/authMiddleware");

router.get("/tags", verifyToken, isInstructorOrAdmin, tagController.listTags);
router.post("/tags", verifyToken, isInstructorOrAdmin, tagController.createTag);
router.get("/", controller.listBooks);
router.get("/:id", controller.getBook);
router.post("/", verifyToken, isInstructorOrAdmin, controller.createBook);

module.exports = router;
