const logger = require('../../../utils/logger.js');
/**
 * @file admin.controller.js
 */
const db = require("../../../config/database");
const bcrypt = require("bcrypt");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const handleControllerError = require("../../../utils/handleControllerError");


/**
 * @desc Get full admin profile (user data + admin-specific + social links)
 * @route GET /api/users/admin/profile
 * @access Admin
 */
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const [user] = await db("users")
      .where({ id: userId })
      .select(
        "id",
        "full_name",
        "email",
        "phone",
        "gender",
        "date_of_birth",
        "avatar_url",
        "is_email_verified",
        "is_phone_verified",
        "profile_complete",
        "created_at",
        "updated_at"
      );

    const [adminProfile] = await db("admin_profiles")
      .where({ user_id: userId })
      .select("job_title", "department", "identity_doc_url", "created_at", "updated_at");

    const socialLinks = await db("user_social_links")
      .where({ user_id: userId })
      .select("platform", "url");

    res.json({
      ...user,
      ...adminProfile,
      social_links: socialLinks,
    });
  } catch (error) {
    handleControllerError(res, error, "Unable to load profile", { userId });
  }
};

/**
 * @desc Update admin profile (user + admin-specific + social links)
 * @route PUT /api/users/admin/profile
 * @access Admin
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    full_name,
    email,
    phone,
    gender,
    date_of_birth,
    avatar_url,
    job_title,
    department,
    social_links = [],
  } = req.body;

  try {
    const normalizedPhone =
      typeof phone === "string" && phone.trim().length > 0 ? phone.trim() : null;

    // 1. Update core user fields
    await db("users").where({ id: userId }).update({
      email,
      full_name,
      phone: normalizedPhone,
      gender,
      date_of_birth,
      avatar_url,
      profile_complete: true,
      updated_at: new Date(),
    });

    // 2. Upsert admin profile
    const profileData = {
      job_title,
      department,
      updated_at: new Date(),
    };

    const existing = await db("admin_profiles").where({ user_id: userId }).first();

    if (existing) {
      await db("admin_profiles").where({ user_id: userId }).update(profileData);
    } else {
      await db("admin_profiles").insert({
        user_id: userId,
        ...profileData,
        created_at: new Date(),
      });
    }

    // 3. Replace social links
    await db("user_social_links").where({ user_id: userId }).del();

    for (const link of social_links) {
      if (link.url?.trim()) {
        await db("user_social_links").insert({
          user_id: userId,
          platform: link.platform,
          url: link.url.trim(),
          created_at: new Date(),
        });
      }
    }

    res.json({ message: "Admin profile updated and marked as complete." });
  } catch (error) {
    handleControllerError(res, error, "Unable to update profile", { userId });
  }
};

/**
 * @desc Change admin password
 * @route PATCH /api/users/admin/change-password
 * @access Admin
 */
exports.resetPasswordAsAdmin = async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters." });
  }

  const newHash = await bcrypt.hash(newPassword, 12);

  await db("users").where({ id: userId }).update({
    password_hash: newHash,
    updated_at: new Date(),
  });

  await notificationService.createNotification({
    user_id: userId,
    type: "security",
    message: "Your password was changed by an administrator",
  });


  await messageService.createMessage({
    sender_id: req.user.id,
    receiver_id: userId,
    message: "Your password was changed by an administrator",
  });


  res.json({ message: "Password reset by SuperAdmin successfully." });
};

/**
 * @desc Upload admin avatar (image)
 * @route PATCH /api/users/admin/:id/avatar
 * @access Admin
 */
exports.updateAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const filePath = `/uploads/admin/avatars/${req.file.filename}`;
  const targetId = req.params.id || req.user.id;

  const [existing] = await db("users")
    .where({ id: targetId })
    .select("id");

  if (!existing) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!existing.id || existing.id !== req.user.id) {
    return res.status(403).json({ message: "Unauthorized avatar update" });
  }

  await db("users")
    .where({ id: existing.id })
    .update({ avatar_url: filePath, updated_at: new Date() });

  res.json({ message: "Avatar updated", avatar_url: filePath });
};

/**
 * @desc Upload identity document (image/pdf)
 * @route POST /api/users/admin/profile/identity
 * @access Admin
 */
exports.uploadIdentityDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No identity file uploaded" });
    }

    const filePath = `/uploads/admin/identity/${req.file.filename}`;

    await db("admin_profiles")
      .where({ user_id: req.user.id })
      .update({
        identity_doc_url: filePath,
        updated_at: new Date(),
      });

    res.status(200).json({
      message: "Identity document uploaded successfully",
      filePath,
    });
  } catch (err) {
    logger.error("Upload error:", err.message);
    res.status(500).json({ message: "Failed to upload identity document" });
  }
};

/**
 * @desc Get aggregated dashboard statistics
 * @route GET /api/users/admin/dashboard-stats
 * @access Admin
 */
exports.getDashboardStats = async (_req, res) => {
  const data = await require("./admin.service").getDashboardStats();
  res.status(200).json({ data });
};
