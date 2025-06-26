
import api from "@/services/api/api";

export const getUsers = async () => {
  const res = await api.get("/chat/users");
  return res.data.data || res.data;
};

export const getGroups = async () => {
  const res = await api.get("/chat/groups");
  return res.data.data || res.data;
};

export const getMessages = async () => {
  const res = await api.get("/messages");
  return res.data.data || res.data;
};

export const markMessageAsRead = async (id) => {
  const res = await api.patch(`/messages/${id}/read`);
  return res.data.data || res.data;

};

export const markMessageAsRead = async (id) => {
  const msg = sampleMessages.find((m) => m.id === id);
  if (msg) {
    msg.read = true;
    return Promise.resolve({ ...msg, read_at: new Date().toISOString() });
  }
  return Promise.resolve({});
};
