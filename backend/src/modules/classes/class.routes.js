const express = require("express");
const router = express.Router();
const controller = require("./class.controller");
const validate = require("../../middleware/validate");
const validator = require("./class.validator");
const {
  verifyToken,
  isInstructorOrAdmin,
} = require("../../middleware/auth/authMiddleware");

router.post(
  "/admin",
  verifyToken,
  isInstructorOrAdmin,
  validate(validator.create),
  controller.createClass
);
router.get("/admin", verifyToken, isInstructorOrAdmin, controller.getAllClasses);
router.get(
  "/admin/:id",
  verifyToken,
  isInstructorOrAdmin,
  controller.getClassById
);
router.put(
  "/admin/:id",
  verifyToken,
  isInstructorOrAdmin,
  validate(validator.update),
  controller.updateClass
);
router.delete(
  "/admin/:id",
  verifyToken,
  isInstructorOrAdmin,
  controller.deleteClass
);

router.get("/", controller.getPublishedClasses);
router.get("/:id", controller.getPublicClassDetails);

module.exports = router;
