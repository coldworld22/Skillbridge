const router = require("express").Router();
const controller = require("./book.controller");
const tagController = require("./bookTag.controller");
const upload = require("./bookUploadMiddleware");
const {
  verifyToken,
  isAdmin,
  isStudent,
} = require("../../middleware/auth/authMiddleware");

router.get("/tags", verifyToken, isAdmin, tagController.listTags);
router.post("/tags", verifyToken, isAdmin, tagController.createTag);
router.get("/", controller.listBooks);
router.get("/admin/:id", verifyToken, isAdmin, controller.getBookAdmin);
router.get("/:id", controller.getBook);
router.post("/", verifyToken, isAdmin, upload, controller.createBook);
router.put("/:id", verifyToken, isAdmin, upload, controller.updateBook);
router.patch("/:id/status", verifyToken, isAdmin, controller.updateBookStatus);
router.post("/cart", verifyToken, isStudent, controller.updateCart);
router.post("/checkout", verifyToken, isStudent, controller.checkout);
router.post("/wishlist", verifyToken, isStudent, controller.addWishlist);
router.delete("/wishlist", verifyToken, isStudent, controller.removeWishlist);
router.delete("/:id", verifyToken, isAdmin, controller.deleteBook);

module.exports = router;
