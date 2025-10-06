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
const { adminProfileSchema } = require("./admin.validator");

const { allowedPlatforms } = require("../common/socialPlatforms");

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

    const [adminProfile = {}] = await db("admin_profiles")
      .where({ user_id: userId })
      .select("job_title", "department", "identity_doc_url", "created_at", "updated_at");

    const adminProfileData = adminProfile || {};

    const socialLinks = await db("user_social_links")
      .where({ user_id: userId })
      .select("platform", "url");

    res.json({
      ...user,
      ...adminProfileData,
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

  // Validate request body using Zod schema
  const validation = adminProfileSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
    return res.status(400).json({ message: "Validation failed", errors });
  }

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
  } = validation.data;

  const profileComplete = [
    full_name,
    email,
    phone,
    gender,
    date_of_birth,
    job_title,
    department,
  ].every(Boolean);

  const trx = await db.transaction();
  try {
    // 1. Update core user fields
    const userUpdate = {
      email,
      full_name,
      phone,
      gender,
      date_of_birth,
      profile_complete: profileComplete,
      updated_at: new Date(),
    };
    if (avatar_url !== undefined) {
      userUpdate.avatar_url = avatar_url;
    }
    await trx("users").where({ id: userId }).update(userUpdate);

    // 2. Upsert admin profile
    const profileData = {
      job_title,
      department,
      updated_at: new Date(),
    };

    const existing = await trx("admin_profiles").where({ user_id: userId }).first();

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

    for (const link of social_links) {
      const sanitizedPlatform =
        typeof link.platform === "string"
          ? link.platform.trim().toLowerCase()
          : "";
      const sanitizedUrl =
        typeof link.url === "string" ? link.url.trim() : "";
      if (
        sanitizedUrl &&
        sanitizedPlatform &&
        allowedPlatforms.includes(sanitizedPlatform)
      ) {
        await trx("user_social_links").insert({
          user_id: userId,
          platform: sanitizedPlatform,
          url: sanitizedUrl,
          created_at: new Date(),
        });
      }
    }
    // 4. Fetch related profile details within the transaction
    const [adminProfile] = await trx("admin_profiles")
      .where({ user_id: userId })
      .select("job_title", "department", "identity_doc_url", "created_at", "updated_at");

    const adminProfileData = adminProfile || {};

    const socialLinks = await trx("user_social_links")
      .where({ user_id: userId })
      .select("platform", "url");

    await trx.commit();

    // Post-commit: fetch core user details using standard connection
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

    return res.json({
      ...user,
      ...adminProfileData,
      social_links: socialLinks,
    });
  } catch (error) {
    await trx.rollback();
    return handleControllerError(res, error, "Unable to update profile", { userId });
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

  try {
    const user = await db("users").where({ id: userId }).first();


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
  const userId = req.params.id;
  try {
    if (String(userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { avatar_url: oldAvatar } = await db("users")
      .where({ id: userId })
      .first("avatar_url");

    const filePath = `/uploads/admin/avatars/${req.file.filename}`;

    await db("users")
      .where({ id: userId })
      .update({ avatar_url: filePath, updated_at: new Date() });

    const isRemoteUrl = (url) => typeof url === "string" && /^https?:\/\//i.test(url);

    if (oldAvatar && !isRemoteUrl(oldAvatar)) {
      const sanitizedOldAvatar = oldAvatar.replace(/^\/+/, "");
      const oldPath = path.join(process.cwd(), sanitizedOldAvatar);
      fs.unlink(oldPath, (err) => {
        if (err && err.code !== "ENOENT") {
          logger.error("Failed to remove old avatar", { userId, err });
        }
      });
    }

    res.json({ message: "Avatar updated", avatar_url: filePath });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) =>
        err && logger.error("Failed to cleanup uploaded avatar", { userId, err })
      );
    }
    logger.error("Failed to upload avatar", { userId, error });
    res.status(500).json({ message: "Failed to upload avatar" });
  }
};

// Remove avatar and clear avatar_url
exports.deleteAvatar = async (req, res) => {
  try {
    if (String(req.params.id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const user = await db("users").where({ id: req.params.id }).first("avatar_url");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isRemoteUrl = (url) => typeof url === "string" && /^https?:\/\//i.test(url);

    if (user.avatar_url && !isRemoteUrl(user.avatar_url)) {
      const filePath = path.join(
        process.cwd(),
        user.avatar_url.replace(/^\/+/, "")
      );
      fs.unlink(filePath, (err) => {
        if (err && err.code !== "ENOENT") {
          logger.error(err);
        }
      });
    }

    await db("users")
      .where({ id: req.params.id })
      .update({ avatar_url: null, updated_at: new Date() });

    res.json({ message: "Avatar removed" });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Failed to remove avatar" });
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

    const identity_doc_url = `/uploads/admin/identity/${req.file.filename}`;

    await adminService.updateAdminProfile(req.user.id, { identity_doc_url });

    res.status(200).json({
      message: "Identity document uploaded successfully",
      identity_doc_url,
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
  try {
    const data = await require("./admin.service").getDashboardStats();
    res.status(200).json({ data });
  } catch (error) {
    logger.error("Failed to fetch dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};
