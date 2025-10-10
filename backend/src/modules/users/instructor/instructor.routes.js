const logger = require('../../../utils/logger.js');
/**
 * Instructor profile controller
 * @file instructor.routes.js
 */
const express = require("express");
const router = express.Router();
const controller = require("./instructor.controller");
const { verifyToken, isInstructor } = require("../../../middleware/auth/authMiddleware");
const { avatarUpload, demoUpload, certificateUpload } = require("./instructorUploadMiddleware");
const db = require("../../../config/database");
const { updateInstructorProfileSchema } = require("./instructor.validator");
const validate = require("../../../middleware/validate");


/**
 * @desc Get instructor profile
 * @route GET /api/users/instructor/profile
 */
router.get("/profile", verifyToken, isInstructor, controller.getProfile);

/**
 * @desc Update instructor profile
 * @route PUT /api/users/instructor/profile
 */
router.put(
  "/profile",
  verifyToken,
  isInstructor,
  validate(updateInstructorProfileSchema),
  controller.updateProfile
);

/**
 * @desc Upload avatar
 * @route PATCH /api/users/instructor/:id/avatar
 */
router.patch(
  "/:id/avatar",
  verifyToken,
  isInstructor,
  avatarUpload.single("avatar"),
  controller.updateAvatar
);

// Upload certificate
// This route handles the upload of instructor certificates
router.post(
  "/certificates",
  verifyToken,
  isInstructor,
  certificateUpload.single("file"),
  controller.uploadCertificate
);

// Delete certificate
router.delete(
  "/certificates/:id",
  verifyToken,
  isInstructor,
  controller.deleteCertificate
);


/**
 * @desc Get instructor profile status
 * @route GET /api/users/instructor/profile/status
 */
router.get("/profile/status", verifyToken, isInstructor, controller.getProfileStatus);


/**
 * @desc Delete instructor avatar
 * @route DELETE /api/users/instructor/:id/avatar
 */
router.delete("/:id/avatar", verifyToken, isInstructor, controller.deleteAvatar);


/**
 * @desc Delete instructor demo video
 * @route DELETE /api/users/instructor/:id/demo
 */
router.delete("/:id/demo", verifyToken, isInstructor, controller.deleteDemoVideo);

/**
 * @desc Toggle instructor profile status (active/inactive)
 * @route PATCH /api/users/instructor/status
 */
router.patch("/status", verifyToken, isInstructor, controller.toggleStatus);

// Availability management
router.get(
  "/availability",
  verifyToken,
  isInstructor,
  controller.getAvailability
);
router.patch(
  "/availability",
  verifyToken,
  isInstructor,
  controller.updateAvailability
);


/**
 * @desc Upload demo video
 * @route PATCH /api/users/instructor/:id/demo
 */
router.patch(
  "/:id/demo",
  verifyToken,
  isInstructor,
  demoUpload.single("demo"),
  async (req, res) => {
    try {
      const requestUserId = req.user?.id ? String(req.user.id) : null;
      const paramId =
        req.params?.id && req.params.id !== "undefined"
          ? String(req.params.id)
          : null;
      const targetId = paramId || requestUserId;

      if (!requestUserId) {
        logger.error("Demo video upload error: missing authenticated user id");
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (targetId !== requestUserId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const demoVideoUrl = `/uploads/demos/instructor/${req.file.filename}`;
      const existing = await db("instructor_profiles")
        .where({ user_id: targetId })
        .first();

      if (existing) {
        await db("instructor_profiles")
          .where({ user_id: targetId })
          .update({ demo_video_url: demoVideoUrl });
      } else {
        await db("instructor_profiles").insert({
          user_id: targetId,
          expertise: JSON.stringify([]),
          demo_video_url: demoVideoUrl,
        });
      }
      res.json({ demo_video_url: demoVideoUrl });
    } catch (err) {
      logger.error("Demo video upload error:", err);
      res.status(500).json({ error: "Failed to upload demo video" });
    }
  }
);

/**
 * @desc Change instructor password
 * @route PATCH /api/users/instructor/change-password
 */
router.patch("/change-password", verifyToken, isInstructor, controller.changePassword);

// Dashboard statistics
router.get(
  "/dashboard-stats",
  verifyToken,
  isInstructor,
  controller.getDashboardStats
);

router.get(
  "/tutorial-views",
  verifyToken,
  isInstructor,
  controller.getTutorialViews
);

module.exports = router;
