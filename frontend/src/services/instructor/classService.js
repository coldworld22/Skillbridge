import api from "@/services/api/api";
import { ensureCsrfToken } from "@/services/api/csrf";
import { API_BASE_URL } from "@/config/config";
import { toDateInput } from "@/utils/date";
import { safeEncodeURI } from "@/utils/url";
import { computeScheduleStatus } from "@/utils/classSchedule";

const normalizeDateValue = (value) => (value ? toDateInput(value) : "");

const buildScheduleDisplay = (start, end, fallbackDate, fallbackTime, startTime) => {
  if (start && end) {
    return start === end ? start : `${start} - ${end}`;
  }

  if (start) {
    const timePortion = startTime || fallbackTime;
    return timePortion ? `${start} @ ${timePortion}` : start;
  }

  if (end) return end;

  const fallbackParts = [fallbackDate, startTime || fallbackTime].filter(Boolean);
  return fallbackParts.join(" @ ");
};

const formatClass = (cls) => {
  const { status, ...rest } = cls;
  const startDateTime = cls.start_date || null;
  const endDateTime = cls.end_date || null;
  return {
    ...rest,
    publishStatus: status,
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
    trending: Boolean(cls.trending),
    start_date: cls.start_date ?? null,
    end_date: cls.end_date ?? null,

    startDateInput: cls.start_date ? toDateInput(cls.start_date) : "",
    endDateInput: cls.end_date ? toDateInput(cls.end_date) : "",

    approvalStatus: cls.moderation_status || "Pending",
    scheduleStatus: computeScheduleStatus(startDateTime, endDateTime),
    views: cls.views || 0,
  };
};

const buildCsrfHeaders = async (headers = {}) => {
  const csrfToken = await ensureCsrfToken();
  if (!csrfToken) return headers;
  return {
    ...headers,
    "x-csrf-token": csrfToken,
  };
};

export const fetchInstructorClasses = async (instructorId) => {
  // Fetch only classes belonging to the specified instructor
  const requestConfig = instructorId ? { params: { instructorId } } : {};
  const { data } = await api.get(
    "users/classes/instructor/my",
    requestConfig,
  );
  const list = data?.data ?? [];
  return list.map(formatClass);
};

export const fetchInstructorClassById = async (id) => {
  const { data } = await api.get(`users/classes/instructor/${id}`);
  return data?.data ? formatClass(data.data) : null;
};

export const createInstructorClass = async (payload, onUploadProgress) => {
  const headers = await buildCsrfHeaders({
    "Content-Type": "multipart/form-data",
  });
  const config = {
    headers,
    ...(onUploadProgress ? { onUploadProgress } : {}),
  };
  const { data } = await api.post(
    "users/classes/instructor",
    payload,
    config,
  );
  return data?.data ? formatClass(data.data) : null;
};

export const updateInstructorClass = async (id, payload) => {
  await ensureCsrfToken();
  const { data } = await api.put(`users/classes/instructor/${id}`, payload, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data?.data ? formatClass(data.data) : null;
};

export const deleteInstructorClass = async (id) => {
  await ensureCsrfToken();
  await api.delete(`users/classes/instructor/${id}`);
  return true;
};

export const fetchInstructorClassAnalytics = async (id) => {
  const { data } = await api.get(`users/classes/instructor/${id}/analytics`);
  return data?.data ?? {};
};

export const toggleClassStatus = async (id) => {
  await ensureCsrfToken();
  const { data } = await api.patch(`users/classes/instructor/${id}/status`);
  return data?.data;
};

export const fetchClassManagementData = async (id) => {
  const { data } = await api.get(`users/classes/instructor/${id}/manage`);
  if (!data?.data) return null;
  return {
    class: data.data.class ? formatClass(data.data.class) : null,
    lessons: data.data.lessons || [],
    assignments: data.data.assignments || [],
  };
};

export const createClassLesson = async (classId, payload) => {
  await ensureCsrfToken();
  const { data } = await api.post(`users/classes/lessons/class/${classId}`, payload);
  return data?.data;
};

export const updateClassLesson = async (lessonId, payload) => {
  await ensureCsrfToken();
  const { data } = await api.put(`users/classes/lessons/${lessonId}`, payload);
  return data?.data;
};

export const deleteClassLesson = async (lessonId) => {
  await ensureCsrfToken();
  await api.delete(`users/classes/lessons/${lessonId}`);
};

export const createClassAssignment = async (classId, payload) => {
  await ensureCsrfToken();
  const { data } = await api.post(`users/classes/assignments/class/${classId}`, payload);
  return data?.data;
};

export const deleteClassAssignment = async (assignmentId) => {
  await ensureCsrfToken();
  await api.delete(`users/classes/assignments/${assignmentId}`);
};

// Fetch upcoming schedule events for the current instructor
// Combines class start dates and lesson times
export const fetchInstructorScheduleEvents = async (
  instructorId,
  providedClasses,
) => {
  const classes = Array.isArray(providedClasses)
    ? providedClasses
    : await fetchInstructorClasses(instructorId);
  const now = new Date();
  const events = [];

  for (const cls of classes) {
    const startDateSource = cls.startDateTime || cls.start_date;
    if (!startDateSource) continue;

    const classStart = new Date(startDateSource);
    if (Number.isNaN(classStart.getTime())) continue;

    // Skip completed classes
    if (cls.scheduleStatus === "Completed") continue;

    // Show ongoing and upcoming classes
    events.push({
      id: `class-${cls.id}`,
      title: `Class: ${cls.title}`,
      start: classStart,
      ...(cls.endDateTime || cls.end_date
        ? (() => {
            const endDateSource = cls.endDateTime || cls.end_date;
            const classEnd = new Date(endDateSource);
            return Number.isNaN(classEnd.getTime()) ? {} : { end: classEnd };
          })()
        : {}),
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
            start: lessonStart,
            ...(lesson.end_time
              ? (() => {
                  const lessonEnd = new Date(lesson.end_time);
                  return Number.isNaN(lessonEnd.getTime())
                    ? {}
                    : { end: lessonEnd };
                })()
              : {}),
          });
        }
      });
    } catch {
      // ignore individual class errors
    }
  }

  return events;
};
