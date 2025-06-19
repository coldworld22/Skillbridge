/**
 * Student controller
 */
const bcrypt = require("bcrypt");
const db = require("../../../config/database");

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

  await db("users")
    .where({ id: userId })
    .update({ full_name, phone, gender, date_of_birth, profile_complete: true });

  const exists = await db("student_profiles").where({ user_id: userId }).first();
  const studentData = { education_level, topics, learning_goals };
  if (exists) {
    await db("student_profiles")
      .where({ user_id: userId })
      .update(studentData);
  } else {
    await db("student_profiles").insert({ user_id: userId, ...studentData });
  }

  await db("user_social_links").where({ user_id: userId }).del();
  if (Array.isArray(social_links)) {
    for (const link of social_links) {
      if (link.url) {
        await db("user_social_links").insert({
          user_id: userId,
          platform: link.platform,
          url: link.url,
        });
      }
    }
  }

  res.json({ message: "Profile updated successfully" });
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

  res.json({ message: "Password changed successfully." });
};
