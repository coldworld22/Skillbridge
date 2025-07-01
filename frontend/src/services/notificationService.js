import api from "@/services/api/api";

export const getNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data.data || res.data;
};

export const markNotificationAsRead = async (id) => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data.data || res.data;
};

export const createNotification = async (payload) => {
  const res = await api.post('/notifications', payload);
  return res.data.data || res.data;
};
