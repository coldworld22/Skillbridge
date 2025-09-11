const logger = require('../../../utils/logger.js');
const fs = require("fs");
const path = require("path");
/**
 * @file admin.controller.js
 */
const db = require("../../../config/database");
const bcrypt = require("bcrypt");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const adminService = require("./admin.service");
const handleControllerError = require("../../../utils/handleControllerError");

// Allowed social platforms for links
const allowedPlatforms = [
  "linkedin",
  "github",
  "twitter",
  "youtube",
  "facebook",
  "instagram",
  "website",
];

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
    // Determine if all required fields are present
    const profileComplete = [full_name, email, phone, job_title, department].every(
      (field) => typeof field === "string" && field.trim()
    );

    // 1. Update core user fields
    await db("users").where({ id: userId }).update({
      email,
      full_name,
      phone,
      gender,
      date_of_birth,
      avatar_url,
      profile_complete: profileComplete,
      updated_at: new Date(),
    });

    const sanitizedLinks = Array.isArray(social_links)
      ? social_links
          .filter(
            (link) =>
              link &&
              typeof link.url === "string" &&
              typeof link.platform === "string" &&
              link.url.trim() &&
              allowedPlatforms.includes(link.platform.trim().toLowerCase())
          )
          .map((link) => {
            const platform = link.platform.trim().toLowerCase();
            let url = link.url.trim();
            if (!/^https?:\/\//i.test(url)) {
              url = `https://${url}`;
            }
            return { platform, url };
          })
      : [];

    await db.transaction(async (trx) => {
      // 1. Update core user fields
      await trx("users").where({ id: userId }).update({
        email,
        full_name,
        phone,
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

      const existing = await trx("admin_profiles")
        .where({ user_id: userId })
        .first();

      if (existing) {
        await trx("admin_profiles").where({ user_id: userId }).update(profileData);
      } else {
        await trx("admin_profiles").insert({
          user_id: userId,
          ...profileData,
          created_at: new Date(),
        });
      }

      // 3. Replace social links
      await trx("user_social_links").where({ user_id: userId }).del();
      for (const link of sanitizedLinks) {
        await trx("user_social_links").insert({
          user_id: userId,
          platform: link.platform,
          url: link.url,
          created_at: new Date(),
        });
      }
    });

    res.json({
      message: profileComplete
        ? "Admin profile updated and marked as complete."
        : "Admin profile updated.",
      profile_complete: profileComplete,
    });
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

  try {
    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters." });
    }

    const user = await db("users").where({ id: userId }).first("id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
  } catch (error) {
    handleControllerError(res, error, "Unable to reset password", { userId });
  }
};

/**
 * @desc Upload admin avatar (image)
 * @route PATCH /api/users/admin/:id/avatar
 * @access Admin
 */
exports.updateAvatar = async (req, res) => {
  try {
    if (String(req.params.id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }
  try {
    const filePath = `/uploads/admin/avatars/${req.file.filename}`;

    await db("users")
      .where({ id: req.params.id })
      .update({ avatar_url: filePath, updated_at: new Date() });

    res.json({ message: "Avatar updated", avatar_url: filePath });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => err && logger.error(err));
    }
    logger.error(error);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
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

    const existingProfile = await db("admin_profiles")
      .where({ user_id: req.user.id })
      .first();

    if (existingProfile) {
      await db("admin_profiles")
        .where({ user_id: req.user.id })
        .update({
          identity_doc_url: filePath,
          updated_at: new Date(),
        });
    } else {
      await db("admin_profiles").insert({
        user_id: req.user.id,
        identity_doc_url: filePath,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

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
