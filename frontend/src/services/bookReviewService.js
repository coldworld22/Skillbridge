import api from "@/services/api/api";

export const fetchReviews = async (bookId, config = {}) => {
  const cfg = Object.keys(config).length ? config : undefined;
  const { data } = await api.get(`book-reviews/books/${bookId}`, cfg);
  return data?.data || { reviews: [], averageRating: 0 };
};

export const createReview = async (payload) => {
  const { data } = await api.post("book-reviews", payload);
  return data?.data;
};

export const updateReview = async (id, payload) => {
  const { data } = await api.put(`book-reviews/${id}`, payload);
  return data?.data;
};

export const deleteReview = async (id) => {
  await api.delete(`book-reviews/${id}`);
  return true;
};

export default {
  fetchReviews,
  createReview,
  updateReview,
  deleteReview,
};
