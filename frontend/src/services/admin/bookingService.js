import api from "@/services/api/api";

export const fetchAllBookings = async () => {
  const { data } = await api.get("/bookings/admin");
  return data?.data ?? [];
};

export const fetchBookingById = async (id) => {
  const { data } = await api.get(`/bookings/admin/${id}`);
  return data?.data;
};

export const createBooking = async (payload) => {
  const { data } = await api.post("/bookings/admin", payload);
  return data?.data;
};

export const updateBooking = async (id, payload) => {
  const { data } = await api.patch(`/bookings/admin/${id}`, payload);
  return data?.data;
};

export const deleteBooking = async (id) => {
  await api.delete(`/bookings/admin/${id}`);
  return true;
};
