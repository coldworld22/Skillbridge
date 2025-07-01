import api from "../api/api";

// 🔍 Search users via backend
const searchUsers = async (query = "") => {
  const { data } = await api.get("/chat/users", { params: { q: query } });
  return data?.data || [];
};

// ✅ Submit full profile to backend
const completeUserProfile = async (userId, data) => {
  return api.put(`/users/${userId}/complete-profile`, data);
};

// ✅ Upload instructor demo video to backend
const uploadDemoVideo = async (userId, file) => {
  const formData = new FormData();
  formData.append("video", file);
  return api.patch(`/users/${userId}/demo-video`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};


const userService = {
  searchUsers,
  completeUserProfile,
  uploadDemoVideo,
};

export default userService;
