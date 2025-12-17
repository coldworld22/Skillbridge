import api from "@/services/api/api";

export const fetchAllInstructors = async (page = 1, limit = 20) => {
  const { data } = await api.get("/users/admin/instructors", {
    params: { page, limit },
  });
  return {
    instructors: data?.data ?? [],
    meta: data?.meta ?? {},
  };
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

export const updateInstructor = async (id, payload) => {
  const { data } = await api.patch(`/users/admin/instructors/${id}`, payload);
  return data?.data;
};
