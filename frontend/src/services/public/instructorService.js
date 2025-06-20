import api from "@/services/api/api";

export const fetchPublicInstructors = async () => {
  const { data } = await api.get("/instructors");
  return data?.data ?? [];
};

export const fetchPublicInstructorById = async (id) => {
  const { data } = await api.get(`/instructors/${id}`);
  return data?.data;
};
