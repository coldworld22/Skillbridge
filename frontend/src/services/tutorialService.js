import api from "@/services/api/api";

export const fetchFeaturedTutorials = async () => {
  const res = await api.get("/users/tutorials/featured");
  return res.data;
};

export const fetchPublishedTutorials = async () => {
  const res = await api.get("/users/tutorials");
  return res.data;
};

export const fetchTutorialDetails = async (id) => {
  const res = await api.get(`/users/tutorials/${id}`);
  return res.data;
};

