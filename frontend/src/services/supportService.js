import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

const formatAvatar = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("blob:") || url.startsWith("data:"))
    return url;
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
  const apiBase = base.replace(/\/?api\/?$/, "");
  return `${apiBase}${url}`;
};

// ─────────────────────
// 📨 Create a support ticket
// ─────────────────────
export const createTicket = async ({ subject, message }) => {
  const { data } = await api.post('/support/tickets', { subject, message });
  return data?.data;
};

export const fetchMyTickets = async () => {
  const { data } = await api.get("/support/my-tickets");
  return data?.data ?? [];
};

export const fetchAllTickets = async (filters = {}) => {
  const { data } = await api.get("/support/admin/tickets", { params: filters });
  const list = data?.data ?? [];
  return list.map(({ created_at, user_avatar, ...rest }) => ({
    ...rest,
    createdAt: created_at,
    user_avatar: formatAvatar(user_avatar),
  }));
};

export const fetchTicketById = async (id) => {
  const { data } = await api.get(`/support/tickets/${id}`);
  const ticket = data?.data;
  if (!ticket) return null;
  const { created_at, user_avatar, messages = [], ...rest } = ticket;
  return {
    ...rest,
    createdAt: created_at,
    user_avatar: formatAvatar(user_avatar),
    messages: messages.map(({ created_at: msgCreatedAt, sender_avatar, ...msgRest }) => ({
      ...msgRest,
      createdAt: msgCreatedAt,
      sender_avatar: formatAvatar(sender_avatar),
    })),
  };
};

export const addMessage = async (id, message) => {
  const { data } = await api.post(`/support/tickets/${id}/messages`, { message });
  return data?.data;
};

export const deleteTicket = async (id) => {
  const { data } = await api.delete(`/support/tickets/${id}`);
  return data?.data;
};

export const updateStatus = async (id, status) => {
  const { data } = await api.patch(`/support/admin/tickets/${id}/status`, { status });
  return data?.data;
};

export const updatePriority = async (id, priority) => {
  const { data } = await api.put(`/tickets/${id}/priority`, { priority });
  return data?.data;
};

export const fetchRecentActivity = async () => {
  const { data } = await api.get("/support/admin/recent-activity");
  return data?.data ?? [];
};

export const fetchSupportAnalytics = async () => {
  const { data } = await api.get("/support/admin/analytics");
  return data?.data ?? {
    open: 0,
    resolved: 0,
    closed: 0,
    avgHours: 0,
    chart: [],
  };
};

