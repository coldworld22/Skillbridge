import api from "@/services/api/api";
import { extractData } from "@/services/api/helpers";
import { API_BASE_URL } from "@/config/config";
import { safeEncodeURI } from "@/utils/url";
import { computeScheduleStatus } from "@/utils/classSchedule";

const formatBaseClass = (cls) => ({
  ...cls,
  cover_image: cls.cover_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${cls.cover_image}`
    : null,
  demo_video_url: cls.demo_video_url
    ? safeEncodeURI(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${cls.demo_video_url}`,
      )
    : null,
  instructor_image: cls.instructor_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${cls.instructor_image}`
    : null,
  instructorBio: cls.instructor_bio || cls.instructorBio,
});

const formatEnrolledClass = (cls) => {
  const base = formatBaseClass(cls);
  const { start_date, end_date, status, progress = 0, ...rest } = base;
  return {
    ...rest,
    startDate: start_date,
    endDate: end_date,
    enrollmentStatus: status,
    scheduleStatus: computeScheduleStatus(start_date, end_date),
    progress: status === "completed" ? 100 : Number(progress) || 0,
  };
};

export const formatClass = (cls) => {
  const base = formatBaseClass(cls);
  return {
    ...base,
    scheduleStatus: computeScheduleStatus(base.start_date, base.end_date),
    trending: Boolean(cls.trending),
  };
};

export const fetchPublishedClasses = async () => {
  const res = await api.get("users/classes");
  const list = extractData(res);
  const formatted = list.map(formatClass);
  return { ...res.data, data: formatted };
};

export const fetchClassDetails = async (id, signal) => {
  const res = await api.get(`users/classes/${id}`, { signal });
  const cls = res.data?.data ?? res.data;
  return cls ? formatClass(cls) : cls;
};

export const enrollInClass = async (id) => {
  const { data } = await api.post(`users/classes/enroll/${id}`);
  return data;
};

export const markClassCompleted = async (id) => {
  const { data } = await api.post(`users/classes/enroll/${id}/complete`);
  return data;
};

export const fetchMyEnrolledClasses = async () => {
  try {
    const res = await api.get("users/classes/enroll/my");
    const list = extractData(res);
    return list.map(formatEnrolledClass);
  } catch (err) {
    if (err.response && [401, 403].includes(err.response.status)) {
      return [];
    }
    throw err;
  }
};

export const fetchClassLessons = async (classId, signal) => {
  const res = await api.get(`users/classes/lessons/class/${classId}`, { signal });
  return extractData(res);
};

const formatAssignment = (assignment) => ({
  ...assignment,
  createdAt: assignment.createdAt ?? assignment.created_at ?? null,
  dueDate: assignment.dueDate ?? assignment.due_date ?? null,
});

export const fetchClassAssignments = async (classId, signal) => {
  const res = await api.get(`users/classes/assignments/class/${classId}`, { signal });
  const list = extractData(res);
  return Array.isArray(list) ? list.map(formatAssignment) : [];
};

export const fetchMyClassAssignments = async () => {
  try {
    const classes = await fetchMyEnrolledClasses();
    const results = [];

    for (const cls of classes) {
      try {
        const assignments = await fetchClassAssignments(cls.id);
        results.push({
          classId: cls.id,
          className: cls.title,
          assignments,
        });
      } catch (err) {
        console.error(`Failed to fetch assignments for class ${cls.id}`, err);
      }
    }

    return results;
  } catch (err) {
    console.error('Failed to fetch enrolled classes', err);
    return [];
  }
};

export const addClassToWishlist = async (id) => {
  const { data } = await api.post(`users/classes/wishlist/${id}`);
  return data;
};

export const removeClassFromWishlist = async (id) => {
  const { data } = await api.delete(`users/classes/wishlist/${id}`);
  return data;
};

export const getMyClassWishlist = async () => {
  try {
    const res = await api.get('users/classes/wishlist/my');
    return extractData(res);
  } catch (err) {
    if (err.response && [401, 403].includes(err.response.status)) {
      return [];
    }
    throw err;
  }
};

export const likeClass = async (id) => {
  const { data } = await api.post(`users/classes/likes/${id}`);
  return data;
};

export const unlikeClass = async (id) => {
  const { data } = await api.delete(`users/classes/likes/${id}`);
  return data;
};

export const getMyLikedClasses = async () => {
  try {
    const res = await api.get('users/classes/likes/my');
    return extractData(res);
  } catch (err) {
    if (err.response && [401, 403].includes(err.response.status)) {
      return [];
    }
    throw err;
  }
};

export const fetchClassReviews = async (classId) => {
  const res = await api.get(`users/classes/reviews/${classId}`);
  return extractData(res);
};

export const submitClassReview = async (classId, payload) => {
  const { data } = await api.post(`users/classes/reviews/${classId}`, payload);
  return data;
};

export const fetchClassComments = async (classId) => {
  const res = await api.get(`users/classes/comments/${classId}`);
  return extractData(res);
};

export const postClassComment = async (classId, payload) => {
  const { data } = await api.post(`users/classes/comments/${classId}`, payload);
  return data;
};

export const subscribeToClassReminder = async (classId) => {
  const { data } = await api.post(`users/classes/notifications/${classId}`);
  return data;
};
