import api from "@/services/api/api";

export const fetchAllAssignments = async () => {
  const { data } = await api.get("/users/classes/assignments/admin");
  return data?.data ?? [];
};
