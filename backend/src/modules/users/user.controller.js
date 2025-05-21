// 📁 src/modules/users/user.controller.js
const userService = require("./user.service");
const authService = require("../auth/auth.service");
const path = require("path");
const db = require("../../config/database");
const userModel = require("./user.model");

// ────────────────────────────────
// Get All Users (Paginated + Search)
// ────────────────────────────────
exports.getAllUsers = async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const result = await userService.fetchUsers({ search, page, limit });
  res.json(result);
};

// ────────────────────────────────
// Get User by ID
// ────────────────────────────────
exports.getUserById = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// ────────────────────────────────
// 📄 Get current logged-in user's base profile
// ────────────────────────────────



exports.getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Destructure the necessary fields
    const {
      id,
      email,
      full_name,
      role,
      avatar_url,
      status,
      profile_complete,
      is_email_verified,
      is_phone_verified
    } = user;

    // Return only the required fields
    res.json({
      id,
      email,
      full_name,
      role,
      avatar_url,
      status,
      profile_complete,
      is_email_verified,
      is_phone_verified
    });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};



// ────────────────────────────────
// Get Logged-in User's Full Profile
// ────────────────────────────────
exports.getMyFullProfile = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role.toLowerCase();

  try {
    const user = await userService.getUserById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let roleProfile = null;
    if (role === "student") {
      roleProfile = await db("student_profiles").where({ user_id: userId }).first();
    } else if (role === "instructor") {
      roleProfile = await db("instructor_profiles").where({ user_id: userId }).first();
    } else if (role === "admin" || role === "superadmin") {
      roleProfile = await db("admin_profiles").where({ user_id: userId }).first();
    }

    const socialLinks = await db("user_social_links")
      .where({ user_id: userId })
      .select("platform", "url");

    res.json({
      ...user,
      roleProfile,
      socialLinks,
    });
  } catch (err) {
    console.error("Failed to load full profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// ────────────────────────────────
// 📋 Complete profile (User + Role-Specific + Social Links)
exports.completeProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      full_name,
      phone,
      role,
      profilePicture, // assumed URL from client
      studentDetails,
      instructorDetails,
      socialLinks,
    } = req.body;

    // 1. Update base user info
    await db("users")
      .where({ id: userId })
      .update({
        full_name,
        phone,
        role,
        avatar_url: profilePicture,
        profile_complete: true,
      });

    // 2. Update role-specific table
    if (role === "student" && studentDetails) {
      const existing = await db("student_profiles").where({ user_id: userId }).first();
      if (existing) {
        await db("student_profiles").where({ user_id: userId }).update(studentDetails);
      } else {
        await db("student_profiles").insert({ user_id: userId, ...studentDetails });
      }
    }

    if (role === "instructor" && instructorDetails) {
      const existing = await db("instructor_profiles").where({ user_id: userId }).first();
      if (existing) {
        await db("instructor_profiles").where({ user_id: userId }).update(instructorDetails);
      } else {
        await db("instructor_profiles").insert({ user_id: userId, ...instructorDetails });
      }
    }

    // 3. Update social links
    if (socialLinks) {
      // Remove previous ones
      await db("user_social_links").where({ user_id: userId }).del();

      // Insert new links
      const socialEntries = Object.entries(socialLinks)
        .filter(([platform, url]) => url?.trim())
        .map(([platform, url]) => ({ user_id: userId, platform, url }));

      if (socialEntries.length) {
        await db("user_social_links").insert(socialEntries);
      }
    }

    return res.json({ message: "Profile completed successfully" });
  } catch (err) {
    console.error("❌ completeProfile error:", err);
    res.status(500).json({ message: "Failed to complete profile" });
  }
};

// ────────────────────────────────
// Create User (Admin only)
// ────────────────────────────────
exports.createUser = async (req, res) => {
  const newUser = await userService.createUser(req.body);
  res.status(201).json(newUser);
};

// ────────────────────────────────
// Update Avatar Image
// ────────────────────────────────
exports.updateAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = `/uploads/avatars/${req.file.filename}`;
  const updated = await userService.updateUser(req.params.id, { avatar_url: filePath });
  res.json({ message: "Avatar updated", avatar_url: filePath, user: updated });
};

// ────────────────────────────────
// Upload Instructor Demo Video
// ────────────────────────────────
exports.uploadDemoVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = `/uploads/demo-videos/${req.file.filename}`;
  await db("instructor_profiles")
    .where({ user_id: req.params.id })
    .update({ demo_video_url: filePath });

  res.json({
    message: "Demo video uploaded successfully",
    video_url: filePath,
  });
};


// ────────────────────────────────
// Update Basic Fields (Admin or Self)
// ────────────────────────────────
exports.updateUser = async (req, res) => {
  const allowedFields = ["full_name", "phone", "profile_complete"];
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }

  const updated = await userService.updateUser(req.params.id, data);
  res.json(updated);
};

// ────────────────────────────────
// Change User Status (Admin)
// ────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const result = await userService.toggleStatus(req.params.id);
    res.json({ message: "User status updated", user: result });
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle status", error: err.message });
  }
};

// ────────────────────────────────
// Update User Role (Admin)
// ────────────────────────────────
exports.updateUserRole = async (req, res) => {
  const user = await userService.updateRole(req.params.id, req.body.role);
  res.json(user);
};

// ────────────────────────────────
// Soft Delete User
// ────────────────────────────────
exports.softDeleteUser = async (req, res) => {
  try {
    const result = await userService.softDelete(req.params.id);
    res.json({ message: "User soft deleted", user: result });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};

// ────────────────────────────────
// Export Users as CSV
// ────────────────────────────────
exports.exportUsers = async (req, res) => {
  const csvBuffer = await userService.exportUsersToCSV();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=users.csv");
  res.send(csvBuffer);
};

// ────────────────────────────────
// Ban / Unban Users (Admin)
// ────────────────────────────────
exports.banUser = async (req, res) => {
  const result = await userService.updateUser(req.params.id, { status: "banned" });
  res.json({ message: "User banned", user: result });
};

exports.unbanUser = async (req, res) => {
  const result = await userService.updateUser(req.params.id, { status: "active" });
  res.json({ message: "User unbanned", user: result });
};

// ────────────────────────────────
// Reset / OTP related
// ────────────────────────────────
exports.requestReset = async (req, res) => {
  try {
    const result = await authService.generateOtp(req.body.email);
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const isValid = await authService.verifyOtp(req.body);
    res.json({ valid: isValid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    await authService.resetPassword(req.body);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};