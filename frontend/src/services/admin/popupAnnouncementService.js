import api from "@/services/api/api";

export const fetchPopupAnnouncements = async () => {
  const { data } = await api.get('popup-announcements');
  return data?.data ?? [];
};

export const createPopupAnnouncement = async (payload) => {
  const { data } = await api.post('popup-announcements', payload);
  return data?.data;
};

export const updatePopupAnnouncement = async (id, payload) => {
  const { data } = await api.patch(`popup-announcements/${id}`, payload);
  return data?.data;
};

export const deletePopupAnnouncement = async (id) => {
  await api.delete(`popup-announcements/${id}`);
  return true;
};
