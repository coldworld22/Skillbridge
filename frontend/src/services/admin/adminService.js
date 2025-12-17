// 📁 src/services/admin/adminService.js
import api from "@/services/api/api";

/**
 * 👤 Get current admin profile.
 * 
 * @returns {Promise<Object>} Admin profile object
 */
export const getAdminProfile = async () => {
  const res = await api.get("/users/admin/profile");
  return res.data;
};

/**
 * ✏️ Update admin profile.
 * 
 * @param {Object} profileData - Admin profile fields to update
 * @returns {Promise<Object>} Updated profile object
 */
export const updateAdminProfile = async (profileData) => {
  const res = await api.put("/users/admin/profile", profileData);
  return res.data;
};

/**
 * 🖼 Upload admin avatar image.
 * 
 * @param {string} adminId - Admin UUID
 * @param {File} avatarFile - Avatar file
 * @returns {Promise<Object>} Upload result
 */

export const uploadAdminAvatar = async (adminId, avatarFile) => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);

  const res = await api.patch(`/users/admin/${adminId}/avatar`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true, // if using cookies
  });
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

  const res = await api.post("/users/admin/profile/identity", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};






/**
 * 🔐 Change admin password (in-session, no OTP).
 *
 * @param {{ currentPassword: string, newPassword: string }} payload
 * @returns {Promise<{ message: string }>} Server response
 */
export const changeAdminPassword = async ({ currentPassword, newPassword }) => {
  const res = await api.patch(`/users/admin/change-password`, {
    currentPassword,
    newPassword,
  });
  return res.data;
};

/**
 * 📊 Fetch dashboard statistics for admin home page
 */
export const fetchAdminDashboardStats = async () => {
  try {
    const res = await api.get("/users/admin/dashboard-stats");
    // The API nests the actual stats under `data`
    return res.data?.data;
  } catch (err) {
    console.error("Failed to fetch admin dashboard stats", err);
    throw err;
  }
};
