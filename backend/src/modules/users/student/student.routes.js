/**
 * Student profile controller
 * @file student.controller.js
 */
const express = require("express");
const router = express.Router();
const controller = require("./student.controller");
const { verifyToken, isStudent } = require("../../../middleware/auth/authMiddleware");
const { avatarUpload, identityUpload } = require("./studentUploadMiddleware");
const db = require("../../../config/database");
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

/**
 * @desc Upload avatar
 * @route PATCH /api/users/student/:id/avatar
 */
router.patch(
  "/:id/avatar",
  verifyToken,isStudent,
  avatarUpload.single("avatar"),
  async (req, res) => {
    const avatarUrl = `/uploads/avatars/student/${req.file.filename}`;
    await db("users").where({ id: req.params.id }).update({ avatar_url: avatarUrl });
    res.json({ avatar_url: avatarUrl });
  }
);

/**
 * @desc Upload identity document
 * @route PATCH /api/users/student/:id/identity
 */
router.patch(
  "/:id/identity",
  verifyToken,isStudent,
  identityUpload.single("identity"),
  async (req, res) => {
    const identityUrl = `/uploads/identity/student/${req.file.filename}`;
    await db("student_profiles")
      .where({ user_id: req.params.id })
      .update({ identity_doc_url: identityUrl });
    res.json({ identity_doc_url: identityUrl });
  }
);

/**
 * @desc Change student password
 * @route PATCH /api/users/student/change-password
 */

router.patch("/change-password", verifyToken, isStudent, controller.changePassword); // ✅ safe



module.exports = router;
