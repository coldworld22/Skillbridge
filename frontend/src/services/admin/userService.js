// 📁 services/admin/userService.js
import api from "@/services/api/api";

// ✅ Get all users (no token required for cookie session)
export const fetchAllUsers = async () => {
  const res = await api.get("/users/admin/users");
  console.log("🧪 Full API response:", res);
  return res.data?.data ?? [];
};


// ✅ Get single user by ID
export const fetchUserById = async (id) => {
  const res = await api.get(`/users/admin/${id}`);
  console.log("🧪 Fetch user by ID:", res.data);
  return res.data?.data;
};

// ✅ Update user status (active, pending, etc.)
export const updateUserStatus = async (id, status) => {
  const res = await api.patch(`/users/admin/${id}/status`, { status });
  console.log("🧪 Updated status:", res.data);
  return res.data?.data;
};

// ✅ Update user role (Admin, Instructor, etc.)
export const updateUserRole = async (id, role) => {
  const res = await api.patch(`/users/admin/${id}/role`, { role });
  console.log("🧪 Updated role:", res.data);
  return res.data?.data;
};

// ✅ Create new user
export const createUser = async (payload) => {
  const res = await api.post("/users/admin", payload);
  console.log("🧪 User created:", res.data);
  return res.data?.data;
};

// ✅ Update profile fields (name, phone, etc.)
export const updateUserProfile = async (id, payload) => {
  const res = await api.patch(`/users/admin/${id}`, payload);
  console.log("🧪 Profile updated:", res.data);
  return res.data?.data;
};

// ✅ Update avatar
export const updateUserAvatar = async (id, avatar_url) => {
  const res = await api.patch(`/users/admin/${id}/avatar`, { avatar_url });
  console.log("🧪 Avatar updated:", res.data);
  return res.data?.data;
};

// ✅ Remove uploaded identity doc
export const removeIdentity = async (id) => {
  await api.delete(`/users/admin/${id}/identity`);
  console.log("🧪 Identity removed");
  return true;
};

// ✅ Restore soft-deleted user
export const restoreUser = async (id) => {
  const res = await api.patch(`/users/admin/${id}/restore`);
  console.log("🧪 User restored:", res.data);
  return res.data?.data;
};

// ✅ Permanently delete user
export const deleteUser = async (id) => {
  await api.delete(`/users/admin/${id}`);
  console.log("🧪 User deleted");
  return true;
};

// ✅ Bulk update status for many users
export const bulkUpdateStatus = async (ids, status) => {
  await api.post("/users/admin/bulk-update-status", { ids, status });
  console.log("🧪 Bulk status update:", { ids, status });
  return true;
};

// ✅ Bulk delete users
export const bulkDeleteUsers = async (ids) => {
  await api.post("/users/admin/bulk-delete", { ids });
  console.log("🧪 Bulk users deleted:", ids);
  return true;
};

// ✅ Reset user password
export const resetUserPassword = async (id) => {
  const res = await api.post(`/users/admin/${id}/reset-password`);
  console.log("🧪 Password reset:", res.data);
  return res.data?.data;
};
