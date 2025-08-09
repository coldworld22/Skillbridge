const router = require("express").Router();
const controller = require("./book.controller");
const tagController = require("./bookTag.controller");
const upload = require("./bookUploadMiddleware");
const {
  verifyToken,
  isAdmin,
  isStudent,
  isInstructorOrAdmin,
} = require("../../middleware/auth/authMiddleware");

router.get("/tags", verifyToken, isAdmin, tagController.listTags);
router.post("/tags", verifyToken, isAdmin, tagController.createTag);
router.get("/admin", verifyToken, isAdmin, controller.listBooks);
router.get("/", controller.listBooks);
router.get("/admin", verifyToken, isAdmin, controller.listBooksAdmin);
router.get("/admin/:id", verifyToken, isAdmin, controller.getBookAdmin);
router.get("/:id", controller.getBook);
router.post("/", verifyToken, isInstructorOrAdmin, upload, controller.createBook);
router.put("/:id", verifyToken, isInstructorOrAdmin, upload, controller.updateBook);
router.patch("/:id/status", verifyToken, isInstructorOrAdmin, controller.updateBookStatus);
router.post("/cart", verifyToken, isStudent, controller.updateCart);
router.post("/checkout", verifyToken, isStudent, controller.checkout);
router.post("/wishlist", verifyToken, isStudent, controller.addWishlist);
router.delete("/wishlist", verifyToken, isStudent, controller.removeWishlist);
router.delete("/:id", verifyToken, isInstructorOrAdmin, controller.deleteBook);

module.exports = router;
