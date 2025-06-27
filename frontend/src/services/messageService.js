
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

export const getConversation = async (userId) => {
  const res = await api.get(`/chat/${userId}`);
  return res.data.data || res.data;
};

export const sendChatMessage = async (userId, { text, file, audio, replyId }) => {
  const form = new FormData();
  if (text) form.append("message", text);
  if (file) form.append("file", file);
  if (audio) form.append("audio", audio);
  if (replyId) form.append("replyTo", replyId);
  const res = await api.post(`/chat/${userId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data || res.data;
};

export const deleteChatMessage = async (id) => {
  const res = await api.delete(`/chat/messages/${id}`);
  return res.data.data || res.data;
};

export const togglePinMessage = async (id) => {
  const res = await api.patch(`/chat/messages/${id}/pin`);
  return res.data.data || res.data;
};
