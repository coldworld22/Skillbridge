import api from "@/services/api/api";

export const fetchAllInstructors = async () => {
  const { data } = await api.get("/users/admin/instructors");
  return data?.data ?? [];
};

export const fetchInstructorById = async (id) => {
  const { data } = await api.get(`/users/admin/instructors/${id}`);
  return data?.data;
};

export const updateInstructorStatus = async (id, status) => {
  const { data } = await api.patch(`/users/admin/instructors/${id}/status`, { status });
  return data?.data;
};

export const deleteInstructor = async (id) => {
  const { data } = await api.delete(`/users/admin/instructors/${id}`);
  return data?.data;
};
