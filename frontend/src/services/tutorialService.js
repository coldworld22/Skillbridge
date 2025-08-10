import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

const formatTutorial = (tut) => {
  const priceInfo =
    tut.price && typeof tut.price === "object"
      ? {
          price: Number(tut.price.amount ?? 0),
          currencyCode:
            tut.price.currency ||
            tut.price.currencyCode ||
            tut.price.currency_code,
        }
      : {
          price: tut.price != null ? Number(tut.price) : 0,
          currencyCode: tut.currencyCode || tut.currency_code,
        };

  return {
    ...tut,
    thumbnail:
      tut.thumbnail_url || tut.cover_image
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${
            tut.thumbnail_url || tut.cover_image
          }`
        : null,
    preview: tut.preview_video
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${tut.preview_video}`
      : null,
    instructor: tut.instructor_name || tut.instructor,
    instructorAvatar: tut.instructor_avatar
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${tut.instructor_avatar}`
      : null,
    instructorBio: tut.instructor_bio || tut.instructorBio,
    ...priceInfo,
    rating: typeof tut.rating === "string" || typeof tut.rating === "number"
      ? parseFloat(tut.rating)
      : 0,
    tags: Array.isArray(tut.tags)
      ? tut.tags
      : typeof tut.tags === "string"
        ? tut.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    trending: Boolean(tut.trending),
  };
};

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

export const enrollInTutorial = async (tutorialId) => {
  const { data } = await api.post(`/users/tutorials/enroll/${tutorialId}`);
  return data;
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

export const addTutorialToFavorites = async (id) => {
  const { data } = await api.post(`/users/tutorials/favorites/${id}`);
  return data;
};

export const removeTutorialFromFavorites = async (id) => {
  const { data } = await api.delete(`/users/tutorials/favorites/${id}`);
  return data;
};

export const getMyTutorialFavorites = async () => {
  const { data } = await api.get('/users/tutorials/favorites/my');
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

// Fetch assignments linked to a tutorial
export const fetchTutorialAssignments = async (tutorialId) => {
  const res = await api.get(`/users/tutorials/assignments/${tutorialId}`);
  return res.data?.data ?? [];
};
