const router = require("express").Router();
const controller = require("./book.controller");
const upload = require("./bookUploadMiddleware");
const validate = require("../../middleware/validate");
const validation = require("./validation/bookValidation");
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../middleware/auth/authMiddleware");

router.use(verifyToken, isInstructorOrAdmin);

router.get("/analytics", controller.getInstructorBookAnalytics);
router.get("/", controller.listInstructorBooks);
router.get("/:id", controller.getInstructorBook);
router.post(
  "/",
  upload,
  validate({ body: validation.createBook }),
  controller.createBook
);

module.exports = router;
