/**
 * @file instructor.controller.js
 */
const bcrypt = require("bcrypt");
const db = require("../../../config/database");

/**
 * @desc Get instructor profile
 * @route GET /api/users/instructor/profile
 * @access Instructor
 */
exports.getProfile = async (req, res) => {
  const userId = req.user.id;

  const [user] = await db("users")
    .where({ id: userId })
    .select(
      "id", "full_name", "email", "phone",
      "gender", "date_of_birth", "avatar_url",
      "is_email_verified", "is_phone_verified",
      "profile_complete", "created_at", "updated_at"
    );

  const [instructor] = await db("instructor_profiles")
    .where({ user_id: userId })
    .select(
      "expertise", "experience", "certifications",
      "availability", "pricing", "demo_video_url"
    );

  const socialLinks = await db("user_social_links")
    .where({ user_id: userId })
    .select("platform", "url");

  res.json({ ...user, instructor, social_links: socialLinks });
};

/**
 * @desc Update instructor profile
 * @route PUT /api/users/instructor/profile
 * @access Instructor
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const {
    full_name, phone, gender, date_of_birth,
    expertise, experience, certifications,
    availability, pricing, demo_video_url,
    social_links
  } = req.body;

  await db("users")
    .where({ id: userId })
    .update({ full_name, phone, gender, date_of_birth, profile_complete: true });

  const exists = await db("instructor_profiles").where({ user_id: userId }).first();
  if (exists) {
    await db("instructor_profiles")
      .where({ user_id: userId })
      .update({ expertise, experience, certifications, availability, pricing, demo_video_url });
  } else {
    await db("instructor_profiles").insert({ user_id: userId, expertise, experience, certifications, availability, pricing, demo_video_url });
  }

  await db("user_social_links").where({ user_id: userId }).del();
  if (Array.isArray(social_links)) {
    for (const link of social_links) {
      if (link.url) {
        await db("user_social_links").insert({ user_id: userId, platform: link.platform, url: link.url });
      }
    }
  }

  res.json({ message: "Profile updated successfully" });
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

  res.json({ message: "Password changed successfully." });
};
