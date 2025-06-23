import api from "@/services/api/api";

export const fetchClassTags = async () => {
  const { data } = await api.get("/users/classes/tags");
  return data?.data ?? [];
};

export const createClassTag = async (payload) => {
  const { data } = await api.post("/users/classes/tags", payload);
  return data?.data;
};
