import api from "@/services/api/api";
import { toDateInput } from "@/utils/date";
import { safeEncodeURI } from "@/utils/url";

const formatClass = (cls) => ({
  ...cls,
  cover_image: cls.cover_image
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${cls.cover_image}`
    : null,
  demo_video_url: cls.demo_video_url
    ? safeEncodeURI(
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
  // Fetch only classes belonging to the current instructor
  // using the dedicated "/admin/my" endpoint
  const { data } = await api.get("/users/classes/admin/my");
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

// Fetch upcoming schedule events for the current instructor
// Combines class start dates and lesson times
export const fetchInstructorScheduleEvents = async () => {
  const classes = await fetchInstructorClasses();
  const now = new Date();
  const events = [];

  for (const cls of classes) {
    if (!cls.start_date) continue;

    // Skip completed classes
    if (cls.scheduleStatus === "Completed") continue;

    // Show ongoing and upcoming classes
    events.push({
      id: `class-${cls.id}`,
      title: `Class: ${cls.title}`,
      start: cls.start_date,
      ...(cls.end_date ? { end: cls.end_date } : {}),
    });

    try {
      const management = await fetchClassManagementData(cls.id);
      management?.lessons?.forEach((lesson) => {
        if (!lesson.start_time) return;
        const lessonStart = new Date(lesson.start_time);
        if (lessonStart >= now) {
          events.push({
            id: `lesson-${lesson.id}`,
            title: `Lesson: ${lesson.title}`,
            start: lesson.start_time,
            ...(lesson.end_time ? { end: lesson.end_time } : {}),
          });
        }
      });
    } catch {
      // ignore individual class errors
    }
  }

  return events;
};
