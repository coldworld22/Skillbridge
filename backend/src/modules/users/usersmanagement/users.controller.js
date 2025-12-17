const logger = require('../../../utils/logger.js');
// 📁 modules/users/usersmanagment/users.controller.js
const db = require("../../../config/database");
const service = require("./users.service");
const catchAsync = require("../../../utils/catchAsync");
const AppError = require("../../../utils/AppError");
const { sendSuccess } = require("../../../utils/response");
const bcrypt = require("bcrypt");
// Controller
exports.getAllUsers = async (_req, res) => {
  const users = await db("users").select("*"); // Add joins for profiles if needed
  sendSuccess(res, users, "Users fetched");
};


exports.getUserById = catchAsync(async (req, res) => {
  const user = await service.getUserById(req.params.id);
  if (!user) throw new AppError("User not found", 404);
  sendSuccess(res, user, "User fetched");
});



exports.createUser = catchAsync(async (req, res) => {
  const { full_name, email, phone, password, role, status, gender } = req.body;

  if (!full_name || !email || !phone || !password || !role) {
    throw new AppError("All fields are required", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const allowedRoles = ["Admin", "Instructor", "Student"];
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  if (!allowedRoles.includes(formattedRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const allowedStatuses = ["pending", "active", "inactive", "suspended"];
  const normalizedStatus = (status || "pending").toLowerCase();
  if (!allowedStatuses.includes(normalizedStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const user = await service.createUser({
    full_name,
    email,
    phone,
    password_hash: hashedPassword,
    role: formattedRole,
    status: normalizedStatus,
    gender,
  });

  sendSuccess(res, user, "User created");
});


exports.updateUserProfile = catchAsync(async (req, res) => {
  const updatedUser = await service.updateUserProfile(req.params.id, req.body);
  sendSuccess(res, updatedUser, "User profile updated");
});


exports.updateUserStatus = catchAsync(async (req, res) => {
  if (process.env.NODE_ENV !== "production") {
    logger.debug("✅ Reached backend updateUserStatus controller");
    logger.debug("🧪 Status value received:", req.body.status);
    logger.debug("🧪 Type:", typeof req.body.status);
  }

  const { status } = req.body;

  if (!["active", "inactive", "suspended", "pending"].includes(status)) {
    throw new AppError("Invalid status", 400);
  }

  const updated = await service.updateUserStatus(req.params.id, status);
  sendSuccess(res, updated, "User status updated");
});



function buildForeignKeyMessage(error, fallback = "Cannot delete user while related records exist.") {
  if (!error?.detail) return fallback;
  const tableMatch = error.detail.match(/table "([^"]+)"/i);
  if (!tableMatch) return fallback;
  const table = tableMatch[1].replace(/_/g, " ");
  return `Cannot delete user because related ${table} records still exist.`;
}


exports.deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await db("users").where({ id }).first();
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const role = (user.role || "").toLowerCase();
  if (role === "superadmin") {
    return res.status(403).json({ message: "Cannot delete SuperAdmin user" });
  }

  try {
    await db("users").where({ id }).del();
    return res.json({ message: "User deleted" });
  } catch (error) {
    if (error?.code === "23503") {
      const friendly = buildForeignKeyMessage(error);
      logger.warn("Foreign key blocked user deletion", {
        userId: id,
        message: friendly,
        detail: error.detail,
      });
      return res.status(409).json({ message: friendly });
    }
    throw error;
  }
});


exports.resetUserPassword = catchAsync(async (req, res) => {
  const newPassword = await service.resetUserPassword(req.params.id);
  sendSuccess(res, { newPassword }, "Password reset successfully");
});



exports.changeUserRole = catchAsync(async (req, res) => {
  let { role } = req.body;

  if (process.env.NODE_ENV !== "production") {
    logger.debug("🧪 Raw role value:", role);
    logger.debug("🧪 Type of role:", typeof role);
  }

  if (typeof role !== "string") {
    return res.status(400).json({ message: "Role must be a string" });
  }

  // Normalize and validate role
  const allowedRoles = ["Admin", "Instructor", "Student"];
  const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

  if (!allowedRoles.includes(formattedRole)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Disallow changing role of SuperAdmin
  const target = await service.getUserById(req.params.id);
  if (target && target.role && target.role.toLowerCase() === "superadmin") {
    throw new AppError("Cannot change role for SuperAdmin user", 403);
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
  sendSuccess(res, updatedUser, "User avatar updated");
});


exports.removeUserIdentity = catchAsync(async (req, res) => {
  await service.removeUserIdentity(req.params.id);
  sendSuccess(res, null, "Identity document removed");
});

exports.restoreUser = catchAsync(async (req, res) => {
  const user = await service.restoreUser(req.params.id);
  sendSuccess(res, user, "User restored");
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
  if (!Array.isArray(ids) || !["active", "inactive", "suspended", "pending"].includes(status)) {
    throw new AppError("Invalid input for bulk update", 400);
  }

  await service.bulkUpdateStatus(ids, status);
  sendSuccess(res, null, "Statuses updated for selected users");
});

exports.bulkDeleteUsers = catchAsync(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    throw new AppError("Invalid user IDs for bulk delete", 400);
  }
  const superAdmins = await db("users")
    .whereIn("id", ids)
    .whereRaw("LOWER(role) = ?", ["superadmin"]);
  if (superAdmins.length) {
    throw new AppError("Cannot delete SuperAdmin user(s)", 403);
  }

  try {
    await service.bulkDeleteUsers(ids);
  } catch (error) {
    if (error?.code === "23503") {
      const friendly = buildForeignKeyMessage(
        error,
        "Cannot delete the selected users because related records still exist."
      );
      logger.warn("Bulk delete blocked by foreign key constraint", {
        ids,
        message: friendly,
        detail: error.detail,
      });
      return res.status(409).json({ message: friendly });
    }
    throw error;
  }

  sendSuccess(res, null, "Selected users deleted");
});
