// 📁 modules/users/usersmanagment/users.controller.js
const db = require("../../../config/database");
const service = require("./users.service");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { success, sendSuccess } = require("../../../utils/response"); 
const bcrypt = require("bcrypt");
// Controller
exports.getAllUsers = async (req, res) => {
  const users = await db("users").select("*"); // Add joins for profiles if needed
  res.json(users);
};


exports.getUserById = catchAsync(async (req, res) => {
  const user = await service.getUserById(req.params.id);
  if (!user) throw new AppError("User not found", 404);
  sendSuccess(res, "User fetched", user);
});


exports.createUser = catchAsync(async (req, res) => {
  const { full_name, email, phone, password, role } = req.body;

  if (!full_name || !email || !phone || !password || !role) {
    throw new AppError("All fields are required", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await service.createUser({
    full_name,
    email,
    phone,
    password_hash: hashedPassword, // ✅ renamed here
    role,
  });

  success(res, "User created", user);
});


exports.updateUserProfile = catchAsync(async (req, res) => {
  const updatedUser = await service.updateUserProfile(req.params.id, req.body);
  sendSuccess(res, "User profile updated", updatedUser);
});


exports.updateUserStatus = catchAsync(async (req, res) => {
  console.log("✅ Reached backend updateUserStatus controller");
  console.log("🧪 Status value received:", req.body.status);
  console.log("🧪 Status value received:", req.body.status);
  console.log("🧪 Type:", typeof req.body.status);

  const { status } = req.body;

  if (!["active", "inactive", "suspended"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const updated = await service.updateUserStatus(req.params.id, status);
  sendSuccess(res, "User status updated", updated);
});



exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  await db("users").where({ id }).del();
  res.json({ message: "User deleted" });
};


exports.resetUserPassword = catchAsync(async (req, res) => {
  const newPassword = await service.resetUserPassword(req.params.id);
  sendSuccess(res, "Password reset successfully", { newPassword });
});



exports.changeUserRole = catchAsync(async (req, res) => {
  let { role } = req.body;

  console.log("🧪 Raw role value:", role);
  console.log("🧪 Type of role:", typeof role);

  if (typeof role !== "string") {
    return res.status(400).json({ message: "Role must be a string" });
  }

  // Capitalize to match DB constraints
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

  const allowedRoles = ["Admin", "Superadmin", "Instructor", "Student"];
  if (!allowedRoles.includes(formattedRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const updatedUser = await service.changeUserRole(req.params.id, formattedRole);
  res.json({ success: true, message: "User role updated", data: updatedUser });
});




exports.uploadUserAvatar = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError("No image uploaded", 400);
  }

  const avatar_url = `/api/uploads/avatars/${req.file.filename}`;
  const updatedUser = await service.updateUserAvatar(req.params.id, avatar_url);
  sendSuccess(res, "User avatar updated", updatedUser);
});


exports.removeUserIdentity = catchAsync(async (req, res) => {
  await service.removeUserIdentity(req.params.id);
  sendSuccess(res, "Identity document removed");
});

exports.restoreUser = catchAsync(async (req, res) => {
  const user = await service.restoreUser(req.params.id);
  sendSuccess(res, "User restored", user);
});

exports.updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await db("users").where({ id }).update({ status });
  res.json({ message: "Status updated" });
};

exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  await db("users").where({ id }).update({ role });
  res.json({ message: "Role updated" });
};


exports.bulkUpdateStatus = catchAsync(async (req, res) => {
  const { ids, status } = req.body;
  if (!Array.isArray(ids) || !["active", "pending"].includes(status)) {
    throw new AppError("Invalid input for bulk update", 400);
  }

  await service.bulkUpdateStatus(ids, status);
  sendSuccess(res, "Statuses updated for selected users");
});

exports.bulkDeleteUsers = catchAsync(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    throw new AppError("Invalid user IDs for bulk delete", 400);
  }
  await service.bulkDeleteUsers(ids);
  sendSuccess(res, "Selected users deleted");
});