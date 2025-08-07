const router = require("express").Router();
const controller = require("./book.controller");
const tagController = require("./bookTag.controller");
const upload = require("./bookUploadMiddleware");
const {
  verifyToken,
  isAdmin,
} = require("../../middleware/auth/authMiddleware");

router.get("/tags", verifyToken, isAdmin, tagController.listTags);
router.post("/tags", verifyToken, isAdmin, tagController.createTag);
router.get("/", controller.listBooks);
router.get("/admin/:id", verifyToken, isAdmin, controller.getBookAdmin);
router.get("/:id", controller.getBook);
router.post("/", verifyToken, isAdmin, upload, controller.createBook);
router.put("/:id", verifyToken, isAdmin, upload, controller.updateBook);
router.patch("/:id/status", verifyToken, isAdmin, controller.updateBookStatus);
router.delete("/:id", verifyToken, isAdmin, controller.deleteBook);

module.exports = router;
