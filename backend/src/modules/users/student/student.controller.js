const logger = require('../../../utils/logger.js');
/**
 * Student controller
 */
const bcrypt = require("bcrypt");
const db = require("../../../config/database");
const notificationService = require("../../notifications/notifications.service");

const messageService = require("../../messages/messages.service");


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

  // Sanitize social links before database operations
  const sanitizedLinks = Array.isArray(social_links)
    ? social_links
        .filter(
          (link) =>
            link &&
            typeof link.url === "string" &&
            typeof link.platform === "string" &&
            link.url.trim()
        )
        .map((link) => ({
          platform: link.platform.trim(),
          url: link.url.trim(),
        }))
    : [];

  const trx = await db.transaction();
  try {
    await trx("users")
      .where({ id: userId })
      .update({ full_name, phone, gender, date_of_birth, profile_complete: true });

    const exists = await trx("student_profiles").where({ user_id: userId }).first();
    const studentData = { education_level, topics, learning_goals };
    if (exists) {
      await trx("student_profiles").where({ user_id: userId }).update(studentData);
    } else {
      await trx("student_profiles").insert({ user_id: userId, ...studentData });
    }

    await trx("user_social_links").where({ user_id: userId }).del();
    for (const link of sanitizedLinks) {
      await trx("user_social_links").insert({
        user_id: userId,
        platform: link.platform,
        url: link.url,
      });
    }

    await trx.commit();
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    await trx.rollback();
    logger.error("Failed to update student profile", err.message);
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
    const avatarUrl = `/uploads/avatars/student/${req.file.filename}`;
    await db("users")
      .where({ id: req.user.id })
      .update({ avatar_url: avatarUrl });
    res.json({ avatar_url: avatarUrl });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Failed to update avatar" });
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
    const exists = await db("student_profiles")
      .where({ user_id: req.user.id })
      .first();
    if (exists) {
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
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res
      .status(400)
      .json({ message: "New password must be at least 8 characters." });
  }

  const [user] = await db("users").where({ id: userId }).select("password_hash");
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

  res.json({ message: "Password changed successfully." });
};
