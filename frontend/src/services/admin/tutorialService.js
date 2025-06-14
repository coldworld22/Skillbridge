// 📁 src/services/admin/tutorialService.js
// Admin specific API calls for managing tutorials

import api from "@/services/api/api";

/**
 * Create a new tutorial as an admin or instructor.
 * Expects multipart/form-data with fields matching the backend validator.
 *
 * @param {FormData} formData - Tutorial payload
 * @returns {Promise<Object>} Created tutorial record
 */
export const createTutorial = async (formData) => {
  const { data } = await api.post("/users/tutorials/admin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

/**
 * Fetch all tutorials for admin dashboard view.
 *
 * @returns {Promise<Array>} Array of tutorial objects
 */
export const fetchAllTutorials = async () => {
  const { data } = await api.get("/users/tutorials/admin");
  const tutorials = data?.data ?? [];
  return tutorials.map((t) => ({
    id: t.id,
    title: t.title,
    thumbnail: t.thumbnail_url
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${t.thumbnail_url}`
      : null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    instructor: t.instructor_name,
    category: t.category_name,
    status: t.status === "published" ? "Published" : "Draft",
    approvalStatus: t.moderation_status ?? "Pending",
    rating: t.rating,
    views: t.views,
  }));
};

/**
 * Permanently delete a tutorial.
 *
 * @param {string} id - Tutorial UUID
 * @returns {Promise<Object>} Server response
 */
export const permanentlyDeleteTutorial = async (id) => {
  const res = await api.delete(`/users/tutorials/admin/${id}`);
  return res.data;
};

export const toggleTutorialStatus = async (id) => {
  const { data } = await api.patch(`/users/tutorials/admin/${id}/status`);
  return data?.data;
};

export const approveTutorial = async (id) => {
  const { data } = await api.patch(`/users/tutorials/admin/${id}/approve`);
  return data?.data;
};

export const rejectTutorial = async (id, reason) => {
  const { data } = await api.patch(`/users/tutorials/admin/${id}/reject`, { reason });
  return data?.data;
};

export const fetchTutorialById = async (id) => {
  const { data } = await api.get(`/users/tutorials/admin/${id}`);
  const t = data?.data;
  if (!t) return null;
  return {
    id: t.id,
    title: t.title,
    shortDescription: t.description,
    category: t.category_id,
    categoryName: t.category_name,
    level: t.level,
    tags: t.tags || [],
    thumbnail: t.thumbnail_url
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${t.thumbnail_url}`
      : null,
    preview: t.preview_video
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${t.preview_video}`
      : null,
    price: t.price,
    isFree: !t.is_paid,
  };
};

export const updateTutorial = async (id, formData) => {
  const { data } = await api.put(`/users/tutorials/admin/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

