import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

const formatClass = (cls) => ({
  ...cls,
  cover_image: cls.cover_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${cls.cover_image}`
    : null,
  demo_video_url: cls.demo_video_url
    ? encodeURI(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${cls.demo_video_url}`,
      )
    : null,
  instructor_image: cls.instructor_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${cls.instructor_image}`
    : null,
  instructorBio: cls.instructor_bio || cls.instructorBio,
});

export const fetchPublishedClasses = async () => {
  const { data } = await api.get("/users/classes");
  const list = data?.data ?? [];
  const formatted = list.map((cls) => ({
    ...formatClass(cls),
    trending: Boolean(cls.trending),
  }));
  return { ...data, data: formatted };
};

export const fetchClassDetails = async (id) => {
  const res = await api.get(`/users/classes/${id}`);
  const cls = res.data?.data ?? res.data;
  return cls ? formatClass(cls) : cls;
};

export const enrollInClass = async (id) => {
  const { data } = await api.post(`/users/classes/enroll/${id}`);
  return data;
};

export const markClassCompleted = async (id) => {
  const { data } = await api.post(`/users/classes/enroll/${id}/complete`);
  return data;
};

export const fetchMyEnrolledClasses = async () => {
  const { data } = await api.get("/users/classes/enroll/my");
  return data?.data ?? [];
};

export const fetchClassLessons = async (classId) => {
  const { data } = await api.get(`/users/classes/lessons/class/${classId}`);
  return data?.data ?? [];
};

export const fetchClassAssignments = async (classId) => {
  const { data } = await api.get(`/users/classes/assignments/class/${classId}`);
  return data?.data ?? [];
};

export const addClassToWishlist = async (id) => {
  const { data } = await api.post(`/users/classes/wishlist/${id}`);
  return data;
};

export const removeClassFromWishlist = async (id) => {
  const { data } = await api.delete(`/users/classes/wishlist/${id}`);
  return data;
};

export const getMyClassWishlist = async () => {
  const { data } = await api.get('/users/classes/wishlist/my');
  return data?.data ?? [];
};

export const likeClass = async (id) => {
  const { data } = await api.post(`/users/classes/likes/${id}`);
  return data;
};

export const unlikeClass = async (id) => {
  const { data } = await api.delete(`/users/classes/likes/${id}`);
  return data;
};

export const getMyLikedClasses = async () => {
  const { data } = await api.get('/users/classes/likes/my');
  return data?.data ?? [];
};

export const fetchClassReviews = async (classId) => {
  const { data } = await api.get(`/users/classes/reviews/${classId}`);
  return data?.data ?? [];
};

export const submitClassReview = async (classId, payload) => {
  const { data } = await api.post(`/users/classes/reviews/${classId}`, payload);
  return data;
};

export const fetchClassComments = async (classId) => {
  const { data } = await api.get(`/users/classes/comments/${classId}`);
  return data?.data ?? [];
};

export const postClassComment = async (classId, payload) => {
  const { data } = await api.post(`/users/classes/comments/${classId}`, payload);
  return data;
};
