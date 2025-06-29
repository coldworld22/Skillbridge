import api from "@/services/api/api";

export const fetchTutorialTags = async (search) => {
  const { data } = await api.get("/users/tutorials/tags", {
    params: search ? { search } : {},
  });
  return data?.data ?? [];
};

export const createTutorialTag = async (payload) => {
  const { data } = await api.post("/users/tutorials/tags", payload);
  return data?.data;
};
