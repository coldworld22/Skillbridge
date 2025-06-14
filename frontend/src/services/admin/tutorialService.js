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
  const res = await api.get("/users/tutorials/admin");
  return res.data?.data ?? [];
};

