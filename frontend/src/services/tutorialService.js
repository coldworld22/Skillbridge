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

export const addTutorialToWishlist = async (id) => {
  const { data } = await api.post(`/users/tutorials/wishlist/${id}`);
  return data;
};

export const removeTutorialFromWishlist = async (id) => {
  const { data } = await api.delete(`/users/tutorials/wishlist/${id}`);
  return data;
};

export const getMyTutorialWishlist = async () => {
  const { data } = await api.get('/users/tutorials/wishlist/my');
  return data?.data ?? [];
};

