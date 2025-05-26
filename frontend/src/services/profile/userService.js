import api from "../api/api";

const mockUsers = [
  { id: 'u1', name: 'Ali Hassan', email: 'ali@example.com' },
  { id: 'u2', name: 'Sarah Youssef', email: 'sarah@example.com' },
  { id: 'u3', name: 'Mohammed Fathy', email: 'm.fathy@example.com' },
  { id: 'u4', name: 'Lina Ahmed', email: 'lina.ahmed@example.com' },
];

// ✅ Mock: Search Users by name/email
const searchUsers = async (query) => {
  return mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
  );
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


// ✅ Mock: Get User Profile
const getUserProfile = async (userId) => {
  return mockUsers.find((u) => u.id === userId);
};

// ✅ Mock: Update User Profile
const updateUserProfile = async (userId, userData) => {
  console.log(`Updating user ${userId}`, userData);
  return { ...userData, id: userId };
};

// ✅ Mock: Change Password
const changePassword = async (userId, passwordData) => {
  console.log(`Changing password for ${userId}`, passwordData);
  return true;
};

const userService = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  searchUsers,
  completeUserProfile,
  uploadDemoVideo
};

export default userService;
