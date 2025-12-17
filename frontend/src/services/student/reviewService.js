import api from "@/services/api/api";

export const fetchStudentReviews = async () => {
  const { data } = await api.get("/instructor-reviews/student/me");
  return data?.data ?? [];
};

export const fetchReviewableInstructors = async () => {
  const { data } = await api.get("/instructor-reviews/student/me/eligible");
  return data?.data ?? [];
};

export const createInstructorReview = async (payload) => {
  const { data } = await api.post("/instructor-reviews", payload);
  return data?.data ?? data;
};

export const updateInstructorReview = async (id, payload) => {
  const { data } = await api.put(`/instructor-reviews/${id}`, payload);
  return data?.data ?? data;
};

export const deleteInstructorReview = async (id) => {
  const { data } = await api.delete(`/instructor-reviews/${id}`);
  return data?.data ?? data;
};

export const updateClassReview = async (classId, payload) => {
  const { data } = await api.post(`/users/classes/reviews/${classId}`, payload);
  return data?.data ?? data;
};

export const deleteClassReview = async (reviewId) => {
  const { data } = await api.delete(`/users/classes/reviews/id/${reviewId}`);
  return data?.data ?? data;
};
