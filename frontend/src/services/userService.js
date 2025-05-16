// src/services/userService.js

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
};

export default userService;
