const logger = require('../../../utils/logger.js');
/**
 * Student controller
 */
const bcrypt = require("bcrypt");
const db = require("../../../config/database");
const fs = require("fs");
const path = require("path");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const { sendPasswordChangeEmails } = require("../passwordNotifications.service");
const studentService = require("./student.service");
const { subtractStorageUsage } = require("../../../middleware/storage");


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
  const tenantId = req.tenant?.id || null;
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
    const studentData = {
      education_level,
      topics,
      learning_goals,
      tenant_id: tenantId || exists?.tenant_id || null,
    };
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
        tenant_id: tenantId,
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
    const tenantId = req.tenant?.id;
    const [current] = await db("users")
      .where({ id: req.user.id })
      .select("avatar_url");

    if (current?.avatar_url) {
      const existingPath = path.join(__dirname, "../../../../", current.avatar_url);
      try {
        if (fs.existsSync(existingPath)) {
          const size = fs.statSync(existingPath)?.size || 0;
          fs.unlinkSync(existingPath);
          if (tenantId && size > 0) {
            await subtractStorageUsage(tenantId, size);
          }
        }
      } catch (err) {
        logger.warn("Failed to delete old student avatar", err.message);
      }
    }

    const avatarUrl = `/uploads/avatars/student/${req.file.filename}`;
    const updateData = { avatar_url: avatarUrl };
    if (tenantId) {
      updateData.tenant_id = tenantId;
    }
    await db("users").where({ id: req.user.id }).update(updateData);
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
    const tenantId = req.tenant?.id;
    const identityUrl = `/uploads/identity/student/${req.file.filename}`;
    const exists = await db("student_profiles")
      .where({ user_id: req.user.id })
      .first();
    if (exists?.identity_doc_url) {
      const oldPath = path.join(__dirname, "../../../../", exists.identity_doc_url);
      try {
        if (fs.existsSync(oldPath)) {
          const size = fs.statSync(oldPath)?.size || 0;
          fs.unlinkSync(oldPath);
          if (tenantId && size > 0) {
            await subtractStorageUsage(tenantId, size);
          }
        }
      } catch (err) {
        logger.warn("Failed to delete old student identity doc", err.message);
      }
    }
    if (exists) {
      await db("student_profiles")
        .where({ user_id: req.user.id })
        .update({
          identity_doc_url: identityUrl,
          tenant_id: tenantId || exists.tenant_id || null,
        });
    } else {
      await db("student_profiles").insert({
        user_id: req.user.id,
        identity_doc_url: identityUrl,
        tenant_id: tenantId,
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
 * @desc Get consolidated student settings
 * @route GET /api/users/student/settings
 * @access Student
 */
exports.getSettings = async (req, res) => {
  try {
    const settings = await studentService.getStudentSettings(req.user.id);
    res.json(settings);
  } catch (error) {
    logger.error("Failed to load student settings", error);
    res.status(500).json({ message: "Failed to load student settings" });
  }
};

/**
 * @desc Update learning preferences
 * @route PATCH /api/users/student/settings/learning
 * @access Student
 */
exports.updateLearningPreferences = async (req, res) => {
  try {
    const learning = await studentService.updateLearningPreferences(
      req.user.id,
      req.body
    );
    res.json({ message: "Learning preferences updated", learning });
  } catch (error) {
    logger.error("Failed to update learning preferences", error);
    res.status(500).json({ message: "Failed to update learning preferences" });
  }
};

/**
 * @desc Update privacy & security settings
 * @route PATCH /api/users/student/settings/privacy
 * @access Student
 */
exports.updatePrivacySettings = async (req, res) => {
  try {
    const privacy = await studentService.updatePrivacySettings(
      req.user.id,
      req.body
    );
    res.json({ message: "Privacy settings updated", privacy });
  } catch (error) {
    logger.error("Failed to update privacy settings", error);
    res.status(500).json({ message: "Failed to update privacy settings" });
  }
};

/**
 * @desc Update UI preferences
 * @route PATCH /api/users/student/settings/ui
 * @access Student
 */
exports.updateUiPreferences = async (req, res) => {
  try {
    const ui = await studentService.updateUiPreferences(req.user.id, req.body);
    res.json({ message: "UI preferences updated", ui });
  } catch (error) {
    logger.error("Failed to update UI preferences", error);
    res.status(500).json({ message: "Failed to update UI preferences" });
  }
};

/**
 * @desc Update account information
 * @route PATCH /api/users/student/settings/account
 * @access Student
 */
exports.updateAccountInfo = async (req, res) => {
  try {
    const updated = await studentService.updateAccountInfo(
      req.user.id,
      req.body
    );
    res.json({
      message: "Account information updated",
      account: updated,
    });
  } catch (error) {
    logger.error("Failed to update account information", error);
    res.status(500).json({ message: "Failed to update account information" });
  }
};
