import api from "@/services/api/api";

export const fetchPublicStudents = async () => {
  const { data } = await api.get("/students");
  return data?.data ?? [];
};

export const fetchPublicStudentById = async (id) => {
  const { data } = await api.get(`/students/${id}`);
  return data?.data;
};
