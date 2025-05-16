const MOCK_MODE = true; // Set to false when backend is ready

// Get User Notifications (Mock or Live)
export const getNotifications = async (userId) => {
  if (MOCK_MODE) {
    // ✅ Mocked notifications
    return [
      {
        id: 1,
        message: `Welcome back, User ${userId}!`,
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        message: "You have been added to the 'AI Pioneers' group.",
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1hr ago
      },
    ];
  } else {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await axios.get(`${API_URL}/notifications/${userId}`);
    return response.data;
  }
};

// Mark Notification as Read (Mock or Live)
export const markNotificationAsRead = async (notificationId) => {
  if (MOCK_MODE) {
    console.log(`Mock: Marked notification ${notificationId} as read`);
    return { success: true };
  } else {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    return await axios.put(`${API_URL}/notifications/${notificationId}/read`);
  }
};
