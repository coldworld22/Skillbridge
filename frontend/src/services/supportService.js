import api from "@/services/api/api";

export const createTicket = async ({ subject, message }) => {
  const { data } = await api.post("/support/tickets", { subject, message });
  return data?.data;
};

export const fetchMyTickets = async () => {
  const { data } = await api.get("/support/my-tickets");
  return data?.data ?? [];
};

export const fetchAllTickets = async () => {
  const { data } = await api.get("/support/admin/tickets");
  return data?.data ?? [];
};

export const fetchTicketById = async (id) => {
  const { data } = await api.get(`/support/tickets/${id}`);
  return data?.data;
};

export const addMessage = async (id, message) => {
  const { data } = await api.post(`/support/tickets/${id}/messages`, { message });
  return data?.data;
};

export const updateStatus = async (id, status) => {
  const { data } = await api.patch(`/support/admin/tickets/${id}/status`, { status });
  return data?.data;
};
