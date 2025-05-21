const userModel = require("./user.model");
const db = require("../../config/database");

/**
 * PATCH /users/profile
 * Updates the user's main profile, role-specific info, and social links
 */
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role.toLowerCase(); // Ensure lowercase consistency

  const {
    full_name,
    phone,
    gender,
    date_of_birth,
    avatar_url,
    studentDetails,
    instructorDetails,
    socialLinks,
  } = req.body;

  try {
    // ─────────────────────────────────────────────────────
    // 1. Update main `users` table fields
    // ─────────────────────────────────────────────────────
    const [updatedUser] = await userModel.updateUser(userId, {
      full_name,
      phone,
      gender,
      date_of_birth,
      avatar_url,
      updated_at: new Date(),
    });

    // ─────────────────────────────────────────────────────
    // 2. If role is "student", update or insert student profile
    // ─────────────────────────────────────────────────────
    if (role === "student" && studentDetails) {
      const exists = await db("student_profiles").where({ user_id: userId }).first();
      if (exists) {
        await db("student_profiles").update(studentDetails).where({ user_id: userId });
      } else {
        await db("student_profiles").insert({ ...studentDetails, user_id: userId });
      }
    }

    // ─────────────────────────────────────────────────────
    // 3. If role is "instructor", update or insert instructor profile
    // ─────────────────────────────────────────────────────
    if (role === "instructor" && instructorDetails) {
      const exists = await db("instructor_profiles").where({ user_id: userId }).first();
      if (exists) {
        await db("instructor_profiles").update(instructorDetails).where({ user_id: userId });
      } else {
        await db("instructor_profiles").insert({ ...instructorDetails, user_id: userId });
      }
    }

    // ─────────────────────────────────────────────────────
    // 4. Replace all user_social_links with new ones
    // ─────────────────────────────────────────────────────
    if (Array.isArray(socialLinks)) {
      await db("user_social_links").where({ user_id: userId }).del();
      for (const link of socialLinks) {
        // Optionally normalize the URL (ensure it starts with http/https)
        const cleanedUrl = link.url?.trim().startsWith("http")
          ? link.url.trim()
          : `https://${link.url.trim()}`;

        await db("user_social_links").insert({
          user_id: userId,
          platform: link.platform,
          url: cleanedUrl,
        });
      }
    }

    // ─────────────────────────────────────────────────────
    // 5. Conditionally set `profile_complete = true`
    // ─────────────────────────────────────────────────────
    const profileComplete =
      full_name && phone && gender && date_of_birth &&
      (role !== "student" || studentDetails) &&
      (role !== "instructor" || instructorDetails) &&
      Array.isArray(socialLinks) && socialLinks.length > 0;

    if (profileComplete) {
      await userModel.updateUser(userId, { profile_complete: true });
    }

    // ─────────────────────────────────────────────────────
    // 6. Final response
    // ─────────────────────────────────────────────────────
    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });

  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
