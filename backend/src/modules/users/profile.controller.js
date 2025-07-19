const userModel = require("./user.model");
const db = require("../../config/database");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

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

      // Notify user profile completion
      await notificationService.createNotification({
        user_id: userId,
        type: "profile",
        message:
          "Your profile is complete! You can now use the platform and all its features.",
      });

      const admins = await userModel.findAdmins();
      const firstAdmin = admins[0];
      if (firstAdmin) {
        await messageService.createMessage({
          sender_id: firstAdmin.id,
          receiver_id: userId,
          message:
            "Your profile is complete! You can now use the platform and all its features.",
        });
      }
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

/**
 * GET /users/me/full-profile
 * Returns the authenticated user's full profile with role-specific data
 */
exports.getFullProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = (req.user.role || '').toLowerCase();

    const [user] = await db('users')
      .where({ id: userId })
      .select(
        'id',
        'full_name',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'avatar_url',
        'is_email_verified',
        'is_phone_verified',
        'profile_complete',
        'created_at',
        'updated_at'
      );

    let roleData = {};

    if (role === 'student') {
      const [student] = await db('student_profiles')
        .where({ user_id: userId })
        .select('education_level', 'topics', 'learning_goals', 'identity_doc_url');
      roleData.student = student || null;
    } else if (role === 'instructor') {
      const [instructor] = await db('instructor_profiles')
        .where({ user_id: userId })
        .select(
          'expertise',
          'experience',
          'certifications',
          'availability',
          'pricing',
          'demo_video_url',
          'bio'
        );
      const certificates = await db('instructor_certificates')
        .where({ user_id: userId })
        .select('id', 'title', 'file_url', 'created_at');
      roleData.instructor = instructor || null;
      roleData.certificates = certificates;
    } else if (role === 'admin') {
      const [adminProfile] = await db('admin_profiles')
        .where({ user_id: userId })
        .select('job_title', 'department', 'identity_doc_url', 'created_at', 'updated_at');
      roleData.admin_profile = adminProfile || null;
    }

    const socialLinks = await db('user_social_links')
      .where({ user_id: userId })
      .select('platform', 'url');

    res.json({ ...user, ...roleData, social_links: socialLinks });
  } catch (err) {
    console.error('Full profile fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
