import api from "@/services/api/api";

export const fetchPosts = async () => {
  const { data } = await api.get("/blog");
  return data?.data ?? [];
};

export const createPost = async (payload) => {
  const { data } = await api.post("/blog", payload, {
    headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return data?.data;
};

export const updatePost = async (id, payload) => {
  const { data } = await api.put(`/blog/${id}`, payload, {
    headers: payload instanceof FormData ? { "Content-Type": "multipart/form-data" } : {},
  });
  return data?.data;
};

export const deletePost = async (id) => {
  await api.delete(`/blog/${id}`);
};
