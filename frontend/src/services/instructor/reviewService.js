import api from "@/services/api/api";

export const fetchInstructorReviews = async (instructorId) => {
  if (!instructorId) {
    throw new Error("An instructor ID is required to load reviews.");
  }

  const { data } = await api.get(
    `/instructor-reviews/instructor/${instructorId}`
  );

  return data?.data ?? [];
};

