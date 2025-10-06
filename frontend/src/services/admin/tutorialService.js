// 📁 src/services/admin/tutorialService.js
// Admin specific API calls for managing tutorials

import api from "@/services/api/api";
import { TUTORIAL_STATUS } from "@/constants/tutorialStatus";

/**
 * Create a new tutorial as an admin or instructor.
 * Expects multipart/form-data with fields matching the backend validator.
 *
 * @param {FormData} formData - Tutorial payload
 * @returns {Promise<Object>} Created tutorial record
 */
export const createTutorial = async (formData) => {
  const { data } = await api.post("users/tutorials/admin", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

/**
 * Fetch tutorials for the admin dashboard with backend pagination.
 *
 * @param {number} page - Page number to fetch
 * @param {number} limit - Number of items per page
 * @param {object} config - Optional Axios config (e.g. abort signal)
 * @returns {Promise<object>} tutorials array and pagination metadata
 */
export const fetchAllTutorials = async (page = 1, limit = 10, config = {}) => {
  const requestConfig = {
    ...config,
    params: { ...(config.params || {}), page, limit },
  };

  const { data } = await api.get("users/tutorials/admin", requestConfig);
  const tutorials = (data?.data ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    instructorId: t.instructor_id,
    thumbnail: t.thumbnail_url
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${t.thumbnail_url}`
      : t.cover_image
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${t.cover_image}`
      : null,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    instructor: t.instructor_name,
    category: t.category_name,
    status:
      t.status === TUTORIAL_STATUS.PUBLISHED
        ? TUTORIAL_STATUS.PUBLISHED
        : TUTORIAL_STATUS.DRAFT,
    approvalStatus: t.moderation_status ?? "Pending",
    rating: t.rating,
    views: t.views,
  }));

  return {
    tutorials,
    meta: data?.meta ?? null,
  };
};

/**
 * Permanently delete a tutorial.
 *
 * @param {string} id - Tutorial UUID
 * @returns {Promise<Object>} Server response
 */
export const permanentlyDeleteTutorial = async (id) => {
  const res = await api.delete(`users/tutorials/admin/${id}`);
  return res.data;
};

export const toggleTutorialStatus = async (id) => {
  const { data } = await api.patch(`users/tutorials/admin/${id}/status`);
  const payload = data?.data;
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const { status = null, moderation_status = null } = payload;

  return {
    status,
    moderation_status,
  };
};

export const approveTutorial = async (id) => {
  const { data } = await api.patch(`users/tutorials/admin/${id}/approve`);
  return data?.data;
};

export const rejectTutorial = async (id, reason) => {
  const { data } = await api.patch(`users/tutorials/admin/${id}/reject`, { reason });
  return data?.data;
};


export const fetchTutorialById = async (id) => {
  const { data } = await api.get(`users/tutorials/admin/${id}`);
  const t = data?.data;
  if (!t) return null;
  return {
    id: t.id,
    title: t.title,
    shortDescription: t.description,
    category: t.category_id,
    categoryName: t.category_name,
    level: t.level,
    language: t.language,
    status: t.status,
    instructorId: t.instructor_id,
    instructorName: t.instructor_name,
    tags: t.tags || [],
    thumbnail: t.thumbnail_url
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${t.thumbnail_url}`
      : t.cover_image
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${t.cover_image}`
      : null,
    preview: t.preview_video
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${t.preview_video}`
      : null,
    price: t.price,
    isFree: !t.is_paid,
  };
};

export const updateTutorial = async (id, formData) => {
  const { data } = await api.put(`users/tutorials/admin/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data;
};

export const bulkApproveTutorials = async (ids) => {
  await api.patch("users/tutorials/admin/bulk/approve", { ids });
  return true;
};

export const bulkDeleteTutorials = async (ids) => {
  await api.post("users/tutorials/admin/bulk-delete", { ids });
  return true;
};



export const fetchAdminTutorialAnalytics = async (id) => {
  const { data } = await api.get(`users/tutorials/admin/${id}/analytics`);
  return data?.data ?? {};
};
