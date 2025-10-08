/**
 * Student profile controller
 * @file student.controller.js
 */
const express = require("express");
const router = express.Router();
const controller = require("./student.controller");
const { verifyToken, isStudent } = require("../../../middleware/auth/authMiddleware");
const { avatarUpload, identityUpload } = require("./studentUploadMiddleware");
const { updateStudentProfileSchema } = require("./student.validator");
const validate = require("../../../middleware/validate");

/**
 * @desc Get student profile
 * @route GET /api/users/student/profile
 */

router.get("/profile", verifyToken,isStudent, controller.getProfile);
/**
 * @desc Update student profile
 * @route PUT /api/users/student/profile
 */
router.put(
  "/profile",
  verifyToken,isStudent,
  validate(updateStudentProfileSchema), // ✅ Zod validation here
  controller.updateProfile
);

const ensureSelf = (req, res, next) => {
  if (req.params.id !== String(req.user.id)) {
    return res.status(403).json({ message: "Unauthorized" });
  }
  next();
};

/**
 * @desc Upload avatar
 * @route PATCH /api/users/student/:id/avatar
 */
router.patch(
  "/:id/avatar",
  verifyToken,
  isStudent,
  ensureSelf,
  avatarUpload.single("avatar"),
  controller.updateAvatar
);

/**
 * @desc Upload identity document
 * @route PATCH /api/users/student/:id/identity
 */
router.patch(
  "/:id/identity",
  verifyToken,
  isStudent,
  ensureSelf,
  identityUpload.single("identity"),
  controller.updateIdentity
);

/**
 * @desc Change student password
 * @route PATCH /api/users/student/change-password
 */

router.patch("/change-password", verifyToken, isStudent, controller.changePassword); // ✅ safe



module.exports = router;
