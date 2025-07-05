import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

const formatTutorial = (tut) => ({
  ...tut,
  thumbnail: tut.thumbnail_url
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${tut.thumbnail_url}`
    : null,
  preview: tut.preview_video
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${tut.preview_video}`
    : null,
  instructor: tut.instructor_name || tut.instructor,
  rating: typeof tut.rating === "string" || typeof tut.rating === "number"
    ? parseFloat(tut.rating)
    : 0,
  tags: tut.tags || [],
  trending: Boolean(tut.trending),
});

export const fetchFeaturedTutorials = async () => {
  const res = await api.get("/users/tutorials/featured");
  const list = res.data?.data ?? res.data ?? [];
  return Array.isArray(list) ? list.map(formatTutorial) : list;
};

export const fetchPublishedTutorials = async () => {
  const res = await api.get("/users/tutorials");
  const list = res.data?.data ?? res.data ?? [];
  return Array.isArray(list) ? list.map(formatTutorial) : list;
};

export const fetchTutorialDetails = async (id) => {
  const res = await api.get(`/users/tutorials/${id}`);
  const tut = res.data?.data ?? res.data;
  return tut ? formatTutorial(tut) : tut;
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

export const fetchTutorialReviews = async (tutorialId) => {
  const { data } = await api.get(`/users/tutorials/reviews/${tutorialId}`);
  return data?.data ?? [];
};

export const submitTutorialReview = async (tutorialId, payload) => {
  const { data } = await api.post(`/users/tutorials/reviews/${tutorialId}`, payload);
  return data;
};

export const fetchTutorialComments = async (tutorialId) => {
  const { data } = await api.get(`/users/tutorials/comments/${tutorialId}`);
  return data?.data ?? [];
};

export const postTutorialComment = async (tutorialId, payload) => {
  const { data } = await api.post(`/users/tutorials/comments/${tutorialId}`, payload);
  return data;
};
