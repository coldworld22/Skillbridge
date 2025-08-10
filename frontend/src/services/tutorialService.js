import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

export const formatTutorial = (tut) => ({
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
  price:
    tut.price === null || tut.price === undefined
      ? null
      : parseFloat(tut.price),
  rating: typeof tut.rating === "string" || typeof tut.rating === "number"
    ? parseFloat(tut.rating)
    : 0,
  tags: Array.isArray(tut.tags)
    ? tut.tags
    : typeof tut.tags === "string"
      ? tut.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [],
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

// Fetch enrollment status and progress for a tutorial
export const fetchEnrollmentStatus = async (tutorialId) => {
  const { data } = await api.get(`/users/tutorials/enroll/${tutorialId}/status`);
  const payload = data?.data ?? data;
  return {
    enrolled: payload.enrolled ?? !!payload.status,
    status: payload.status ?? null,
    progress: payload.progress ?? 0,
  };
};

// Update progress percentage for a tutorial
export const updateTutorialProgress = async (tutorialId, progress) => {
  const { data } = await api.patch(`/users/tutorials/enroll/${tutorialId}/progress`, { progress });
  return data;
};
