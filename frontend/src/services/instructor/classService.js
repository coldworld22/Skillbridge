import api from "@/services/api/api";
import { toDateInput } from "@/utils/date";

const formatClass = (cls) => ({
  ...cls,
  cover_image: cls.cover_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${cls.cover_image}`
    : null,
  demo_video_url: cls.demo_video_url
    ? encodeURI(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${cls.demo_video_url}`,
      )
    : null,
  instructor_image: cls.instructor_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${cls.instructor_image}`
    : null,
  trending: Boolean(cls.trending),

  start_date: cls.start_date ? toDateInput(cls.start_date) : "",
  end_date: cls.end_date ? toDateInput(cls.end_date) : "",

  approvalStatus: cls.moderation_status || "Pending",
  scheduleStatus: computeScheduleStatus(cls.start_date, cls.end_date),
  views: cls.views || 0,
});

const computeScheduleStatus = (start, end) => {
  const now = new Date();
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (s && now < s) return "Upcoming";
  if (s && e && now >= s && now <= e) return "Ongoing";
  if (e && now > e) return "Completed";
  return "Upcoming";
};

export const fetchInstructorClasses = async () => {
  const { data } = await api.get("/users/classes/admin");
  const list = data?.data ?? [];
  return list.map(formatClass);
};

export const fetchInstructorClassById = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}`);
  return data?.data ? formatClass(data.data) : null;
};

export const createInstructorClass = async (payload, onUploadProgress) => {
  const { data } = await api.post("/users/classes/admin", payload, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress ? { onUploadProgress } : {}),
  });
  return data?.data ? formatClass(data.data) : null;
};

export const updateInstructorClass = async (id, payload) => {
  const { data } = await api.put(`/users/classes/admin/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data ? formatClass(data.data) : null;
};

export const deleteInstructorClass = async (id) => {
  await api.delete(`/users/classes/admin/${id}`);
  return true;
};

export const fetchInstructorClassAnalytics = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}/analytics`);
  return data?.data ?? {};
};

export const toggleClassStatus = async (id) => {
  const { data } = await api.patch(`/users/classes/admin/${id}/status`);
  return data?.data;
};

export const approveInstructorClass = async (id) => {
  const { data } = await api.patch(`/users/classes/admin/${id}/approve`);
  return data?.data;
};

export const rejectInstructorClass = async (id, reason) => {
  const { data } = await api.patch(`/users/classes/admin/${id}/reject`, { reason });
  return data?.data;
};

export const fetchClassManagementData = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}/manage`);
  if (!data?.data) return null;
  return {
    class: data.data.class ? formatClass(data.data.class) : null,
    lessons: data.data.lessons || [],
    assignments: data.data.assignments || [],
  };
};

export const createClassLesson = async (classId, payload) => {
  const { data } = await api.post(`/users/classes/lessons/class/${classId}`, payload);
  return data?.data;
};

export const updateClassLesson = async (lessonId, payload) => {
  const { data } = await api.put(`/users/classes/lessons/${lessonId}`, payload);
  return data?.data;
};

export const deleteClassLesson = async (lessonId) => {
  await api.delete(`/users/classes/lessons/${lessonId}`);
};

export const createClassAssignment = async (classId, payload) => {
  const { data } = await api.post(`/users/classes/assignments/class/${classId}`, payload);
  return data?.data;
};

export const deleteClassAssignment = async (assignmentId) => {
  await api.delete(`/users/classes/assignments/${assignmentId}`);
};
