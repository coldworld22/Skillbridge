const router = require("express").Router();
const controller = require("./book.controller");
const tagController = require("./bookTag.controller");
const upload = require("./bookUploadMiddleware");
const validate = require("../../middleware/validate");
const validation = require("./validation/bookValidation");
const {
  verifyToken,
  isAdmin,
  isStudent,
  isInstructorOrAdmin,
} = require("../../middleware/auth/authMiddleware");

// Allow instructors to search and create tags (consistent with classes)
router.get("/tags", verifyToken, isInstructorOrAdmin, tagController.listTags);
router.post("/tags", verifyToken, isInstructorOrAdmin, tagController.createTag);
router.get("/", controller.listBooks);
router.get("/admin", verifyToken, isAdmin, controller.listBooksAdmin);
router.get("/admin/:id", verifyToken, isAdmin, controller.getBookAdmin);
router.get(
  "/:id/pdf",
  verifyToken,
  isInstructorOrAdmin,
  controller.downloadBookFile
);
router.get("/:id", controller.getBook);
router.post(
  "/",
  verifyToken,
  isInstructorOrAdmin,
  upload,
  validate({ body: validation.createBook }),
  controller.createBook
);
router.put(
  "/:id",
  verifyToken,
  isInstructorOrAdmin,
  upload,
  validate({ body: validation.updateBook }),
  controller.updateBook
);
router.patch(
  "/:id/status",
  verifyToken,
  isInstructorOrAdmin,
  validate({ body: validation.updateBookStatus }),
  controller.updateBookStatus
);
router.post(
  "/cart",
  verifyToken,
  isStudent,
  validate({ body: validation.cartAction }),
  controller.updateCart
);
router.post("/checkout", verifyToken, isStudent, controller.checkout);
router.post(
  "/wishlist",
  verifyToken,
  isStudent,
  validate({ body: validation.wishlist }),
  controller.addWishlist
);
router.delete(
  "/wishlist",
  verifyToken,
  isStudent,
  validate({ body: validation.wishlist }),
  controller.removeWishlist
);
router.delete("/:id", verifyToken, isInstructorOrAdmin, controller.deleteBook);

module.exports = router;
