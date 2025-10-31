
import api from "@/services/api/api";
import { getCsrfToken } from "@/services/api/csrf";
import useCallStore from "@/store/call/callStore";
import useAuthStore from "@/store/auth/authStore";
import useMessageStore from "@/store/messages/messageStore";
import socket from "@/services/socketService";

export const getUsers = async (query) => {
  const config = {};
  if (query) {
    const q =
      typeof query === "string"
        ? query.trim()
        : typeof query.q === "string"
        ? query.q.trim()
        : "";
    if (q) {
      config.params = { q };
    }
  }

  const res = await api.get("/chat/users", config);
  const data = res.data.data || res.data;
  return (data || []).map((u) => ({
    ...u,
    lastMessage: u.lastMessage || u.last_message,
    lastMessageAt: u.lastMessageAt || u.last_message_at,
  }));
};

export const getGroups = async () => {
  const res = await api.get("/groups/my");
  const data = res.data.data || res.data;
  return (data || []).map((g) => ({
    ...g,
    lastMessage: g.lastMessage || g.last_message,
    lastMessageAt: g.lastMessageAt || g.last_message_at,
  }));
};

export const getMessages = async ({ limit, offset } = {}) => {
  const params = {};
  if (limit !== undefined) params.limit = limit;
  if (offset !== undefined) params.offset = offset;
  const res = await api.get("/messages", { params });
  return res.data.data || res.data;
};

export const markMessageAsRead = async (id) => {
  const headers = {};
  const token = getCsrfToken();
  if (token) headers["x-csrf-token"] = token;
  const res = await api.patch(`/messages/${id}/read`, {}, { headers });
  return res.data.data || res.data;
};

export const deleteMessage = async (id) => {
  const headers = {};
  const token = getCsrfToken();
  if (token) headers["x-csrf-token"] = token;
  const res = await api.delete(`/messages/${id}`, { headers });
  return res.data.data || res.data;
};

export const sendDirectEmail = async (userId, { subject, message }) => {
  const res = await api.post(`/messages/${userId}/email`, { subject, message });
  return res.data.data || res.data;
};

export const sendWhatsAppMessage = async (userId, { message }) => {
  const res = await api.post(`/messages/${userId}/whatsapp`, { message });
  return res.data.data || res.data;
};

export const startVideoCall = async (userId, metadata = {}) => {
  try {
    const res = await api.post(`/messages/${userId}/video-call`);
    const { roomId, callId } = res.data.data || res.data;
    useCallStore.getState().initiateCall({
      chatId: userId,
      roomId,
      callId,
      ...metadata,
    });
    const caller = useAuthStore.getState().user;
    if (caller?.id) {
      socket.emit("call-user", { to: userId, roomId, callId, ...metadata });
    }
    return { roomId, callId };
  } catch (err) {
    console.error("Failed to start video call", err);
    throw err;
  }
};

export const respondToCall = async (callId, action) => {
  const res = await api.post(`/messages/call/${callId}/respond`, { action });
  return res.data.data || res.data;
};

export const endCall = async (callId) => {
  const res = await api.post(`/messages/call/${callId}/end`);
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

// Attach socket listeners for incoming/accepted/declined calls
export const listenCalls = () => useCallStore.getState().listen();

let msgListener = false;
const msgHandler = () => {
  useMessageStore.getState().fetch(true);
};

export const listenMessages = () => {
  if (msgListener) return;
  socket.on("message-created", msgHandler);
  msgListener = true;
};

export const stopListenMessages = () => {
  if (!msgListener) return;
  socket.off("message-created", msgHandler);
  msgListener = false;
};

// Helpers to read call status from the store
export const acceptedCall = () => useCallStore.getState().acceptedCall;

export const declined = () => useCallStore.getState().declined;

export const clearCallStatus = () => useCallStore.getState().clearStatus();
