import api from "@/services/api/api";

export const fetchStudentBookings = async () => {
  const { data } = await api.get("/bookings/student");
  return data?.data ?? [];
};

export const updateStudentBooking = async (id, payload) => {
  const { data } = await api.patch(`/bookings/student/${id}`, payload);
  return data?.data;
};

export const createStudentBooking = async (payload) => {
  const { data } = await api.post("/bookings/student", payload);
  return data?.data;
};

export const deleteStudentBooking = async (id) => {
  await api.delete(`/bookings/student/${id}`);
  return true;
};
