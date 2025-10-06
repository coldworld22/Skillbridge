import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

// Normalize any URL returned from the API (avatars, attachments, etc.)
const formatUrl = (url) => {
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
  const { data } = await api.post('support/tickets', { subject, message });
  return data?.data;
};

export const fetchMyTickets = async (config = {}) => {
  const cfg = Object.keys(config).length ? config : undefined;
  const { data } = await api.get("support/my-tickets", cfg);
  const list = data?.data ?? [];
  return list.map(({ created_at, user_avatar, ...rest }) => ({
    ...rest,
    createdAt: created_at,
    user_avatar: formatUrl(user_avatar),
  }));
};

export const fetchAllTickets = async (filters = {}) => {
  const { data } = await api.get("support/admin/tickets", { params: filters });
  const list = data?.data ?? [];
  return list.map(({ created_at, user_avatar, ...rest }) => ({
    ...rest,
    createdAt: created_at,
    user_avatar: formatUrl(user_avatar),
  }));
};

export const fetchTicketById = async (id) => {
  const { data } = await api.get(`support/tickets/${id}`);
  const ticket = data?.data;
  if (!ticket) return null;
  const { created_at, user_avatar, messages = [], ...rest } = ticket;
  return {
    ...rest,
    createdAt: created_at,
    user_avatar: formatUrl(user_avatar),
    messages: messages.map(
      ({ created_at: msgCreated, sender_avatar, attachments = [], ...msgRest }) => ({
        ...msgRest,
        createdAt: msgCreated,
        sender_avatar: formatUrl(sender_avatar),
        attachments: attachments.map(({ file_url, ...attRest }) => ({
          ...attRest,
          file_url: formatUrl(file_url),
        })),
      })
    ),
  };
};

export const addMessage = async (id, message) => {
  const { data } = await api.post(`support/tickets/${id}/messages`, { message });
  return data?.data;
};

export const uploadAttachment = async (messageId, file) => {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post(
    `support/messages/${messageId}/attachments`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data?.data;
};

export const deleteTicket = async (id) => {
  const { data } = await api.delete(`support/tickets/${id}`);
  return data?.data;
};

export const updateStatus = async (id, status) => {
  const normalized = status?.toLowerCase();
  const { data } = await api.patch(`support/admin/tickets/${id}/status`, { status: normalized });
  return data?.data;
};

export const updatePriority = async (id, priority) => {
  const { data } = await api.patch(`support/admin/tickets/${id}/priority`, {
    priority,
  });
  return data?.data;
};

export const fetchRecentActivity = async () => {
  const { data } = await api.get("support/admin/recent-activity");
  const list = data?.data ?? [];
  return list.map(({ created_at, ...rest }) => ({
    ...rest,
    createdAt: created_at,
  }));
};

export const fetchSupportAnalytics = async () => {
  const { data } = await api.get("support/admin/analytics");
  return data?.data ?? {
    open: 0,
    resolved: 0,
    closed: 0,
    avgHours: 0,
    chart: [],
  };
};

