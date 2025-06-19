import api from "@/services/api/api";

export const fetchInstructorBookings = async () => {
  const { data } = await api.get("/bookings/instructor");
  return data?.data ?? [];
};

export const updateInstructorBooking = async (id, payload) => {
  const { data } = await api.patch(`/bookings/instructor/${id}`, payload);
  return data?.data;
};
