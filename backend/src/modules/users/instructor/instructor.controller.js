const logger = require('../../../utils/logger.js');
/**
 * @file instructor.controller.js
 */
const bcrypt = require("bcrypt");
const db = require("../../../config/database");
const fs = require("fs");
const path = require("path");
const instructorService = require("./instructor.service");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const { sendPasswordChangeEmails } = require("../passwordNotifications.service");
const {
  parseAvailabilitySlots,
  sanitizeAvailabilitySlots,
} = require("./instructorAvailability.util");
const { subtractStorageUsage } = require("../../../middleware/storage");



/**
 * @desc Get instructor profile
 * @route GET /api/users/instructor/profile
 * @access Instructor
 */
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const userExists = await db("users").where({ id: userId }).first();
    if (!userExists) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingProfile = await db("instructor_profiles")
      .where({ user_id: userId })
      .first();

    if (!existingProfile) {
      await db("instructor_profiles").insert({
        user_id: userId,
        expertise: JSON.stringify([]),
        experience: null,
        bio: null,
        certifications: null,
        pricing: null,
        demo_video_url: null,
      });
    }

    const payload = await instructorService.getInstructorProfile(userId);
    res.json(payload);
  } catch (err) {
    logger.error("Instructor profile load error:", err);
    res.status(500).json({ message: "Failed to load instructor profile" });
  }
};


/**
 * @desc Toggle instructor online/offline status
 * @route PATCH /api/users/instructor/status
 * @access Instructor
 */
exports.toggleStatus = async (req, res) => {
    const userId = req.user.id;
    const { is_online } = req.body;

    if (typeof is_online !== "boolean") {
        return res.status(400).json({ message: "is_online must be true or false." });
    }
    const [updated] = await db("users")
        .where({ id: userId })
        .update({ is_online })
        .returning(["id", "is_online"]);

    res.json({
        message: `Status set to ${updated.is_online ? "online" : "offline"}`,
        is_online: updated.is_online,
    });
};

/**
 * @desc Upload a certificate file
 * @route POST /api/users/instructor/certificates
 * @access Instructor
 */
exports.uploadCertificate = async (req, res) => {
    const userId = req.user.id;
    const { title } = req.body;
    const file = req.file;

    if (!title || !file) {
        return res.status(400).json({ message: "Title and file are required." });
    }

    const fileUrl = `/uploads/certificates/instructor/${file.filename}`;
    const [inserted] = await db("instructor_certificates")
        .insert({ user_id: userId, title, file_url: fileUrl })
        .returning(["id", "title", "file_url"]);

    res.json(inserted);
};

/**
 * @desc Delete a certificate file
 * @route DELETE /api/users/instructor/certificates/:id
 * @access Instructor
 */
exports.deleteCertificate = async (req, res) => {
    const userId = req.user.id;
    const certId = req.params.id;

    const cert = await db("instructor_certificates")
        .where({ id: certId, user_id: userId })
        .first();

    if (!cert) {
        return res.status(404).json({ message: "Certificate not found." });
    }

    const filePath = path.join(__dirname, "../../../../", cert.file_url);
    try {
        if (fs.existsSync(filePath)) {
            const size = fs.statSync(filePath)?.size || 0;
            fs.unlinkSync(filePath);
            if (req.tenant?.id && size > 0) {
                await subtractStorageUsage(req.tenant.id, size);
            }
        }
    } catch (err) {
        logger.warn("Could not delete file:", err.message);
    }

    await db("instructor_certificates").where({ id: certId }).del();

    res.json({ message: "Certificate deleted successfully." });
};

/**
 * @desc Update instructor profile
 * @route PUT /api/users/instructor/profile
 * @access Instructor
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    full_name,
    phone,
    gender,
    date_of_birth,
    expertise,
    experience,
    bio,
    certifications,
    pricing,
    demo_video_url,
    social_links,
  } = req.body;

  try {
    await instructorService.updateInstructorProfile(
      userId,
      { full_name, phone, gender, date_of_birth },
      {
        expertise,
        experience,
        bio,
        certifications,
        pricing,
        demo_video_url,
      },
      Array.isArray(social_links) ? social_links : []
    );

    const updated = await instructorService.getInstructorProfile(userId);
    await notificationService.createNotification({
      user_id: userId,
      type: "profile_update",
      message: "Your profile was updated successfully",
    });
    res.json(updated);
  } catch (err) {
    logger.error("Profile update error:", err);

    // Handle unique constraint violations for email and phone
    if (err.code === "23505") {
      if (err.constraint === "users_email_unique") {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (err.constraint === "users_phone_unique") {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    res.status(500).json({ message: "Failed to update profile" });
  }
};

/**
 * @desc Check if instructor profile is complete
 * @route GET /api/users/instructor/profile/status
 * @access Instructor
 */
exports.getProfileStatus = async (req, res) => {
    const userId = req.user.id;

    const [user] = await db("users")
        .where({ id: userId })
        .select("profile_complete");

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    res.json({ profile_complete: user.profile_complete });
};


/**
 * @desc Update instructor avatar
 * @route PATCH /api/users/instructor/:id/avatar
 * @access Instructor
 */
exports.updateAvatar = async (req, res) => {
    if (process.env.NODE_ENV !== "production") {
        logger.debug("📥 Incoming avatar upload");
    }

    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const ownerId = req.user?.id ? String(req.user.id) : null;
        const paramId =
            req.params?.id && req.params.id !== "undefined"
                ? String(req.params.id)
                : null;
        const targetId = paramId || ownerId;

        if (!ownerId) {
            logger.error("❌ Avatar upload error: missing authenticated user id");
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (paramId && paramId !== ownerId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const avatarUrl = `/uploads/avatars/instructor/${req.file.filename}`;

        const current = await db("users").where({ id: targetId }).first();
        if (current?.avatar_url) {
            const oldPath = path.join(__dirname, "../../../../", current.avatar_url);
            if (fs.existsSync(oldPath)) {
                const size = fs.statSync(oldPath)?.size || 0;
                fs.unlinkSync(oldPath);
                if (req.tenant?.id && size > 0) {
                    await subtractStorageUsage(req.tenant.id, size);
                }
            }
        }

        const updateData = { avatar_url: avatarUrl };
        if (req.tenant?.id) {
            updateData.tenant_id = req.tenant.id;
        }
        await db("users").where({ id: targetId }).update(updateData);

        res.json({ avatar_url: avatarUrl });
    } catch (err) {
        logger.error("❌ Avatar upload error:", err.message);
        res.status(500).json({ error: "Failed to upload avatar" });
    }
};

/**
 * @desc Delete instructor avatar
 * @route DELETE /api/users/instructor/:id/avatar
 * @access Instructor
 */
exports.deleteAvatar = async (req, res) => {
    const userId = req.params.id;

    const [user] = await db("users").where({ id: userId }).select("avatar_url");
    if (!user || !user.avatar_url) {
        return res.status(404).json({ message: "Avatar not found." });
    }

    const filePath = path.join(__dirname, "../../../../", user.avatar_url);
    try {
        if (fs.existsSync(filePath)) {
            const size = fs.statSync(filePath)?.size || 0;
            fs.unlinkSync(filePath);
            if (req.tenant?.id && size > 0) {
                await subtractStorageUsage(req.tenant.id, size);
            }
        }
    } catch (err) {
        logger.error("❌ Failed to delete avatar:", err.message);
    }

    await db("users").where({ id: userId }).update({ avatar_url: null });

    res.json({ message: "Avatar deleted successfully." });
};

/**
 * @desc Upload instructor demo video
 * @route PATCH /api/users/instructor/:id?/demo
 * @access Instructor
 */
exports.uploadDemoVideo = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        const ownerId = req.user.id;
        const paramId = req.params?.id;
        const targetId = paramId && paramId !== "undefined" ? paramId : ownerId;

        if (targetId !== ownerId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const demoVideoUrl = `/uploads/demos/instructor/${req.file.filename}`;
        const existing = await db("instructor_profiles").where({ user_id: ownerId }).first();

        if (existing?.demo_video_url) {
            const oldPath = path.join(__dirname, "../../../../", existing.demo_video_url);
            if (fs.existsSync(oldPath)) {
                const size = fs.statSync(oldPath)?.size || 0;
                fs.unlinkSync(oldPath);
                if (req.tenant?.id && size > 0) {
                    await subtractStorageUsage(req.tenant.id, size);
                }
            }
        }

        if (existing) {
            await db("instructor_profiles")
                .where({ user_id: ownerId })
                .update({ demo_video_url: demoVideoUrl });
        } else {
            await db("instructor_profiles").insert({
                user_id: ownerId,
                expertise: JSON.stringify([]),
                demo_video_url: demoVideoUrl,
            });
        }

        return res.json({ demo_video_url: demoVideoUrl });
    } catch (err) {
        logger.error("Demo video upload error:", err);
        return res.status(500).json({ error: "Failed to upload demo video" });
    }
};

/**
 * @desc Delete instructor demo video
 * @route DELETE /api/users/instructor/:id/demo
 * @access Instructor
 */
exports.deleteDemoVideo = async (req, res) => {
    const userId = req.params.id;

    const [profile] = await db("instructor_profiles").where({ user_id: userId }).select("demo_video_url");
    if (!profile || !profile.demo_video_url) {
        return res.status(404).json({ message: "Demo video not found." });
    }

    const filePath = path.join(__dirname, "../../../../", profile.demo_video_url);
    try {
        if (fs.existsSync(filePath)) {
            const size = fs.statSync(filePath)?.size || 0;
            fs.unlinkSync(filePath);
            if (req.tenant?.id && size > 0) {
                await subtractStorageUsage(req.tenant.id, size);
            }
        }
    } catch (err) {
        logger.error("❌ Failed to delete demo video:", err.message);
    }

    await db("instructor_profiles").where({ user_id: userId }).update({ demo_video_url: null });

    res.json({ message: "Demo video deleted successfully." });
};



/**
 * @desc Change instructor password
 * @route PATCH /api/users/instructor/change-password
 * @access Instructor
 */
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters." });
    }

    const [user] = await db("users")
        .where({ id: userId })
        .select("password_hash", "email", "full_name", "role");
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await db("users").where({ id: userId }).update({
        password_hash: newHash,
        updated_at: new Date(),
    });

    await notificationService.createNotification({
        user_id: userId,
        type: "security",
        message: "Your password was changed successfully",
    });


    await messageService.createMessage({
        sender_id: userId,
        receiver_id: userId,
        message: "Your password was changed successfully",
    });

    await sendPasswordChangeEmails({
        targetUser: {
            id: userId,
            email: user.email,
            full_name: user.full_name,
            role: user.role || req.user.role,
        },
        actor: req.user,
    });


    res.json({ message: "Password changed successfully." });
};

/**
 * @desc Get instructor availability
 * @route GET /api/users/instructor/availability
 * @access Instructor
 */
exports.getAvailability = async (req, res) => {
    const userId = req.user.id;
    const [profile] = await db('instructor_profiles')
        .where({ user_id: userId })
        .select('availability_slots');

    const availability = parseAvailabilitySlots(profile?.availability_slots);

    res.json({ availability_slots: availability });
};

/**
 * @desc Update instructor availability
 * @route PATCH /api/users/instructor/availability
 * @access Instructor
 */
exports.updateAvailability = async (req, res) => {
    const userId = req.user.id;
    const { availability_slots } = req.body;

    const result = sanitizeAvailabilitySlots(availability_slots);
    if (!result.ok) {
        const payload = { message: result.message || 'Invalid availability data.' };
        if (typeof result.index === 'number') {
            payload.index = result.index;
        }
        if (result.issues) {
            payload.errors = result.issues;
        }
        return res.status(400).json(payload);
    }

    const sanitizedSlots = result.value;
    const serialized = JSON.stringify(sanitizedSlots);

    await db('instructor_profiles')
        .insert({ user_id: userId, availability_slots: serialized })
        .onConflict('user_id')
        .merge({ availability_slots: serialized, updated_at: db.fn.now() });

    res.json({ message: 'Availability updated successfully', availability_slots: sanitizedSlots });
};

/**
 * @desc Get dashboard statistics for instructor
 * @route GET /api/users/instructor/dashboard-stats
 * @access Instructor
 */
exports.getDashboardStats = async (req, res) => {
    const userId = req.user.id;
    const data = await require('./instructor.service').getDashboardStats(userId);
    res.json({ data });
};

/**
 * @desc Get tutorial views grouped by week for instructor
 * @route GET /api/users/instructor/tutorial-views
 * @access Instructor
 */
exports.getTutorialViews = async (req, res) => {
    const userId = req.user.id;
    const weeks = parseInt(req.query.weeks, 10) || 4;
    const service = require('./instructor.service');
    const data = await service.getTutorialViewsByWeek(userId, weeks);
    res.json({ data });
};
