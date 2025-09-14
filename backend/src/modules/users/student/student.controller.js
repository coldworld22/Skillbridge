const logger = require('../../../utils/logger.js');
const fs = require("fs");
const path = require("path");
/**
 * Student controller
 */
const db = require("../../../config/database");
const userService = require("../user.service");
const { allowedPlatforms } = require("../common/socialPlatforms");
const { getStudentProfile, updateStudentProfile } = require("./student.service");


/**
 * @desc Get student profile
 * @route GET /api/users/student/profile
 * @access Student
 */
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

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

  const [student] = await db("student_profiles")
    .where({ user_id: userId })
    .select("education_level", "topics", "learning_goals", "identity_doc_url");

  const socialLinks = await db("user_social_links")
    .where({ user_id: userId })
    .select("platform", "url");

  res.json({ ...user, student, social_links: socialLinks });
};

/**
 * @desc Update student profile
 * @route PUT /api/users/student/profile
 * @access Student
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    full_name,
    phone,
    gender,
    date_of_birth,
    education_level,
    topics,
    learning_goals,
    social_links,
  } = req.body;

  const normalizeUrl = (url = "") => {
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  };

  // Sanitize social links before database operations
  const sanitizedLinks = Array.isArray(social_links)
    ? social_links
        .filter(
          (link) =>
            link &&
            typeof link.url === "string" &&
            typeof link.platform === "string" &&
            allowedPlatforms.includes(link.platform.trim().toLowerCase()) &&
            link.url.trim()
        )
        .map((link) => ({
          platform: link.platform.trim().toLowerCase(),
          url: normalizeUrl(link.url),
        }))
        .filter((link) => allowedPlatforms.includes(link.platform))
    : [];

  const userData = { full_name, phone, gender, date_of_birth };
  const studentData = { education_level, topics, learning_goals };

  try {
    const result = await updateStudentProfile(
      userId,
      userData,
      studentData,
      sanitizedLinks
    );

    const profile = await getStudentProfile(userId);
    res.json({ ...profile, ...result });
  } catch (err) {
    // Handle unique constraint violations for email and phone
    if (err.code === "23505") {
      if (err.constraint === "users_email_unique") {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (err.constraint === "users_phone_unique") {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    logger.error("Failed to update student profile", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

/**
 * @desc Update student avatar
 * @route PATCH /api/users/student/:id/avatar
 * @access Student
 */
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No avatar uploaded" });
    }

    const { avatar_url: oldAvatar } = await db("users")
      .where({ id: req.user.id })
      .first("avatar_url");

    const avatarUrl = `/uploads/avatars/student/${req.file.filename}`;
    await db("users")
      .where({ id: req.user.id })
      .update({ avatar_url: avatarUrl });

    if (oldAvatar) {
      const sanitizedOldAvatar = oldAvatar.replace(/^\//, "");
      const oldPath = path.join(process.cwd(), sanitizedOldAvatar);
      fs.unlink(oldPath, (err) =>
        err && logger.error("Failed to remove old avatar:", err)
      );
    }

    res.json({ avatar_url: avatarUrl });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => err && logger.error(err));
    }
    logger.error(error);
    res.status(500).json({ message: "Failed to upload avatar" });
  }
};

/**
 * @desc Update student identity document
 * @route PATCH /api/users/student/:id/identity
 * @access Student
 */
exports.updateIdentity = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No identity document uploaded" });
    }
    const identityUrl = `/uploads/identity/student/${req.file.filename}`;
    const existingProfile = await db("student_profiles")
      .where({ user_id: req.user.id })
      .first();
    if (existingProfile) {
      if (existingProfile.identity_doc_url) {
        const sanitizedPath = existingProfile.identity_doc_url.replace(/^\//, "");
        const oldPath = path.join(process.cwd(), sanitizedPath);
        fs.unlink(oldPath, (err) =>
          err &&
          logger.error("Failed to remove old identity document:", err)
        );
      }

    if (profile) {
      await db("student_profiles")
        .where({ user_id: req.user.id })
        .update({ identity_doc_url: identityUrl });
    } else {
      await db("student_profiles").insert({
        user_id: req.user.id,
        identity_doc_url: identityUrl,
      });
    }

    res.json({ identity_doc_url: identityUrl });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => err && logger.error(err));
    }
    logger.error(error);
    res.status(500).json({ message: "Failed to update identity document" });
  }
};

/**
 * @desc Change student password
 * @route PATCH /api/users/student/change-password
 * @access Student
 */
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "New password must be at least 8 characters." });
  }

  await userService.updateUser(userId, { password: newPassword });

  res.json({ message: "Password changed successfully." });
};
