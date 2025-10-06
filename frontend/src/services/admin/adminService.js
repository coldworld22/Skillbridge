// 📁 src/services/admin/adminService.js
import api from "@/services/api/api";
import { ensureCsrfToken } from "@/services/api/csrf";

/**
 * 👤 Get current admin profile.
 * 
 * @returns {Promise<Object>} Admin profile object
 */
export const getAdminProfile = async (config = {}) => {
  const cfg = Object.keys(config).length ? config : undefined;
  const res = await api.get("users/admin/profile", cfg);
  return res.data;
};

/**
 * ✏️ Update admin profile.
 *
 * @param {Object} profileData - Admin profile fields to update
 * @returns {Promise<Object>} Updated profile including user info,
 * admin-specific details, and social links
 */
export const updateAdminProfile = async (profileData) => {
  const headers = {};
  const csrfToken = await ensureCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const res = await api.put("users/admin/profile", profileData, { headers });
  return res.data;
};

/**
 * 🖼 Upload admin avatar image.
 *
 * Ensure a CSRF cookie has been set via a prior safe GET request before
 * calling this function so the Axios instance can attach the token.
 *
 * @param {string} adminId - Admin UUID
 * @param {File} avatarFile - Avatar file
 * @returns {Promise<Object>} Upload result
 */

export const uploadAdminAvatar = async (adminId, avatarFile) => {
  // Ensure a CSRF cookie exists so Axios can automatically attach the token
  await ensureCsrfToken();

  const formData = new FormData();
  formData.append("avatar", avatarFile);

  const res = await api.patch(`users/admin/${adminId}/avatar`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
/**
 * 🗑 Remove admin avatar image.
 *
 * @param {string} adminId - Admin UUID
 * @returns {Promise<Object>} Result message
 */
export const deleteAdminAvatar = async (adminId) => {
  await ensureCsrfToken();
  const res = await api.delete(`users/admin/${adminId}/avatar`);
  return res.data;
};

/**
 * 🪪 Upload admin identity file (e.g., ID card).
 *
 * @param {File} identityFile - ID image file
 * @returns {Promise<Object>} Upload result
 */

export const uploadAdminIdentity = async (file) => {
  const formData = new FormData();
  formData.append("identity", file); // this must match multer field name

  const headers = { "Content-Type": "multipart/form-data" };

  // Acquire a CSRF token (sets cookie if needed) and include it if present
  const csrfToken = await ensureCsrfToken();
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const res = await api.post("users/admin/profile/identity", formData, {
    headers,
    withCredentials: true, // rely on default cookie-based auth
  });

  return res.data;
};






/**
 * 🔐 Change admin password (in-session, no OTP).
 * 
 * @param {string} adminId - Admin UUID
 * @param {string} newPassword - New secure password
 * @returns {Promise<{ message: string }>} Server response
 */
export const changeAdminPassword = async (adminId, newPassword) => {
  const res = await api.post(`users/admin/reset-password/${adminId}`, {
    newPassword,
  });
  return res.data;
};

/**
 * 📊 Fetch dashboard statistics for admin home page
 */
export const fetchAdminDashboardStats = async () => {
  try {
    const res = await api.get("users/admin/dashboard-stats");
    // The API nests the actual stats under `data`
    return res.data?.data;
  } catch (err) {
    console.error("Failed to fetch admin dashboard stats", err);
    throw err;
  }
};
