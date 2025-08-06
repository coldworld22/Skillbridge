const router = require("express").Router();
const controller = require("./book.controller");
const tagController = require("./bookTag.controller");
const upload = require("./bookUploadMiddleware");
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../middleware/auth/authMiddleware");

router.get("/tags", verifyToken, isInstructorOrAdmin, tagController.listTags);
router.post("/tags", verifyToken, isInstructorOrAdmin, tagController.createTag);
router.get("/", controller.listBooks);
router.get("/:id", controller.getBook);
router.post("/", verifyToken, isInstructorOrAdmin, upload, controller.createBook);
router.put("/:id", verifyToken, isInstructorOrAdmin, upload, controller.updateBook);
router.delete("/:id", verifyToken, isInstructorOrAdmin, controller.deleteBook);

module.exports = router;
