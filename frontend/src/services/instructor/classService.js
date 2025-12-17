import api from "@/services/api/api";
import { toDateInput } from "@/utils/date";
import { safeEncodeURI } from "@/utils/url";
import { computeScheduleStatus } from "@/utils/classSchedule";

const formatClass = (cls = {}) => {
  const startRaw = cls.start_date || "";
  const endRaw = cls.end_date || "";

  return {
    ...cls,
    publishStatus: cls.status,
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
    start_date: startRaw,
    end_date: endRaw,
    startDateInput: startRaw ? toDateInput(startRaw) : "",
    endDateInput: endRaw ? toDateInput(endRaw) : "",
    approvalStatus: cls.moderation_status || "Pending",
    scheduleStatus: computeScheduleStatus(startRaw, endRaw),
    views: cls.views || 0,
    included_plans: (() => {
      if (Array.isArray(cls.included_plans)) return cls.included_plans;
      if (!cls.included_plans) return [];
      try {
        const parsed = JSON.parse(cls.included_plans);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [cls.included_plans];
      }
    })(),
  };
};

const formatResource = (resource = {}) => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  return {
    ...resource,
    downloadUrl:
      resource.resource_type === "file" && resource.resource_url
        ? safeEncodeURI(`${base}${resource.resource_url}`)
        : resource.resource_url,
  };
};

export const fetchInstructorClasses = async () => {
  // Fetch only classes belonging to the current instructor
  // using the dedicated "/instructor/my" endpoint
  const { data } = await api.get("/users/classes/instructor/my");
  const list = data?.data ?? [];
  return list.map(formatClass);
};

export const fetchInstructorClassById = async (id) => {
  const { data } = await api.get(`/users/classes/instructor/${id}`);
  return data?.data ? formatClass(data.data) : null;
};

export const createInstructorClass = async (payload, onUploadProgress) => {
  const { data } = await api.post("/users/classes/instructor", payload, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress ? { onUploadProgress } : {}),
  });
  return data?.data ? formatClass(data.data) : null;
};

export const updateInstructorClass = async (id, payload) => {
  const { data } = await api.put(`/users/classes/instructor/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data ? formatClass(data.data) : null;
};

export const deleteInstructorClass = async (id) => {
  await api.delete(`/users/classes/instructor/${id}`);
  return true;
};

export const fetchInstructorClassAnalytics = async (id) => {
  const { data } = await api.get(`/users/classes/instructor/${id}/analytics`);
  return data?.data ?? {};
};

export const toggleClassStatus = async (id) => {
  const { data } = await api.patch(`/users/classes/instructor/${id}/status`);
  return data?.data;
};

export const fetchClassManagementData = async (id) => {
  const { data } = await api.get(`/users/classes/instructor/${id}/manage`);
  if (!data?.data) return null;
  return {
    class: data.data.class ? formatClass(data.data.class) : null,
    lessons: data.data.lessons || [],
    assignments: data.data.assignments || [],
    resources: Array.isArray(data.data.resources)
      ? data.data.resources.map(formatResource)
      : [],
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

  await Promise.all(
    classes.map(async (cls) => {
      if (!cls.start_date) return;
      if (cls.scheduleStatus === "Completed") return;

      const classEvent = {
        id: `class-${cls.id}`,
        title: `Class: ${cls.title}`,
        start: cls.start_date,
        ...(cls.end_date ? { end: cls.end_date } : {}),
        backgroundColor: "#1f2937",
        borderColor: "#111827",
        textColor: "#f9fafb",
        extendedProps: {
          type: "class",
          classId: cls.id,
          displayTitle: cls.title,
          scheduleStatus: cls.scheduleStatus,
          startDate: cls.start_date,
          endDate: cls.end_date,
          deliveryMode: cls.delivery_mode || cls.deliveryMode || "Online",
          level: cls.level || cls.difficulty || null,
          subject: cls.subject || null,
          enrolledCount:
            typeof cls.enrolled_count === "number"
              ? cls.enrolled_count
              : cls.enrolledCount ?? null,
          maxStudents:
            typeof cls.max_students === "number"
              ? cls.max_students
              : cls.maxStudents ?? null,
        },
      };

      events.push(classEvent);

      try {
        const management = await fetchClassManagementData(cls.id);
        management?.lessons?.forEach((lesson) => {
          if (!lesson?.start_time) return;
          const lessonStart = new Date(lesson.start_time);
          if (lessonStart < now) return;

          const rawDuration =
            typeof lesson.duration === "number"
              ? lesson.duration
              : typeof lesson.duration_minutes === "number"
              ? lesson.duration_minutes
              : parseInt(lesson.duration, 10);

          const durationMinutes = Number.isFinite(rawDuration)
            ? rawDuration
            : null;

          const lessonEvent = {
            id: `lesson-${lesson.id}`,
            title: `Lesson: ${lesson.title}`,
            start: lesson.start_time,
            ...(lesson.end_time ? { end: lesson.end_time } : {}),
            backgroundColor: "#065f46",
            borderColor: "#064e3b",
            textColor: "#ecfdf5",
            extendedProps: {
              type: "lesson",
              classId: cls.id,
              lessonId: lesson.id,
              classTitle: cls.title,
              displayTitle: lesson.title,
              scheduleStatus: cls.scheduleStatus,
              startTime: lesson.start_time,
              endTime: lesson.end_time || null,
              durationMinutes,
              instructorNotes: lesson.notes || null,
            },
          };

          events.push(lessonEvent);
        });
      } catch {
        // ignore individual class errors
      }
    })
  );

  return events.sort((a, b) => new Date(a.start) - new Date(b.start));
};
