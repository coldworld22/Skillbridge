import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";
import { toDateInput } from "@/utils/date";
import { safeEncodeURI } from "@/utils/url";
import { computeScheduleStatus } from "@/utils/classSchedule";

const DISPLAY_FALLBACK_KEYS = [
  "name",
  "title",
  "full_name",
  "fullName",
  "displayName",
  "label",
];

const toDisplayString = (value) => {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toDisplayString(entry)).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    for (const key of DISPLAY_FALLBACK_KEYS) {
      if (key in value) {
        const nested = toDisplayString(value[key]);
        if (nested) {
          return nested;
        }
      }
    }

    if ("id" in value && value.id != null) {
      const idValue = value.id;
      if (typeof idValue === "string") {
        return idValue;
      }
      if (typeof idValue === "number" && Number.isFinite(idValue)) {
        return String(idValue);
      }
    }

    try {
      return JSON.stringify(value);
    } catch (err) {
      return "";
    }
  }

  return "";
};

const resolveDateTime = (cls, keys) => {
  for (const key of keys) {
    if (cls[key] != null) {
      return cls[key];
    }
  }
  return null;
};

const resolveDisplayDate = (rawValue, displayValue) => {
  const candidate = displayValue ?? rawValue;

  if (!candidate) {
    return "";
  }

  const date = candidate instanceof Date ? candidate : new Date(candidate);
  if (Number.isNaN(date.getTime())) {
    return typeof candidate === "string" || typeof candidate === "number"
      ? String(candidate)
      : "";
  }

  return date.toISOString();
};

const formatClass = (cls) => {
  if (!cls || typeof cls !== "object") {
    return null;
  }

  const { status, schedule_status, ...rest } = cls;
  const startDateTime = resolveDateTime(cls, [
    "start_date",
    "startDate",
    "start_date_time",
    "startDateTime",
  ]);
  const endDateTime = resolveDateTime(cls, [
    "end_date",
    "endDate",
    "end_date_time",
    "endDateTime",
  ]);
  const startDateDisplay = resolveDisplayDate(startDateTime, (
    cls.start_date_display ??
    cls.startDateDisplay ??
    cls.start_date_formatted ??
    cls.startDateFormatted
  ));
  const endDateDisplay = resolveDisplayDate(endDateTime, (
    cls.end_date_display ??
    cls.endDateDisplay ??
    cls.end_date_formatted ??
    cls.endDateFormatted
  ));

  const title = toDisplayString(
    cls.title ?? cls.name ?? cls.class_title ?? rest.title
  );
  const instructor = toDisplayString(
    cls.instructor ??
      cls.instructor_name ??
      cls.instructorName ??
      cls.instructor_full_name ??
      cls.instructor?.name ??
      cls.instructor?.full_name
  );
  const category = toDisplayString(
    cls.category ??
      cls.category_name ??
      cls.categoryName ??
      cls.category?.name ??
      cls.category?.title
  );

  const priceValue = Number.parseFloat(cls.price);

  return {
    ...rest,
    title,
    instructor,
    category,
    createdAt: cls.created_at ? new Date(cls.created_at).toISOString() : null,
    publishStatus: status,
    cover_image: cls.cover_image
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${cls.cover_image}`
      : null,
    demo_video_url: cls.demo_video_url
      ? safeEncodeURI(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL
          }${cls.demo_video_url}`,
        )
      : null,
    instructor_image: cls.instructor_image
      ? `${
          process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL
        }${cls.instructor_image}`
      : null,
    trending: Boolean(cls.trending),

    start_date: startDateDisplay ? startDateDisplay.split("T")[0] : null,
    end_date: endDateDisplay ? endDateDisplay.split("T")[0] : null,

    startDateTime,
    endDateTime,

    startDateInput: startDateDisplay ? toDateInput(startDateDisplay) : "",
    endDateInput: endDateDisplay ? toDateInput(endDateDisplay) : "",

    approvalStatus: cls.moderation_status || "Pending",
    scheduleStatus:
      schedule_status || computeScheduleStatus(startDateTime, endDateTime),
    views: cls.views || 0,
    price:
      Number.isFinite(priceValue) && priceValue >= 0
        ? Number(priceValue.toFixed(2))
        : cls.price || 0,
  };
};

export const fetchAdminClasses = async ({
  page = 1,
  limit = 10,
  filter = "",
  approval = "All",
  status = "All",
  schedule,
} = {}) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filter) params.set("filter", filter);
  if (approval && approval !== "All") params.set("approval", approval);
  if (status && status !== "All") params.set("status", status);
  if (schedule) params.set("schedule", schedule);
  const { data } = await api.get("users/classes/admin", {
    params: Object.fromEntries(params.entries()),
  });

  const rawList = data?.data;
  const list = Array.isArray(rawList)
    ? rawList
    : rawList && typeof rawList === "object"
    ? Object.values(rawList)
    : [];

  const formattedList = [];

  for (const entry of list) {
    const formatted = formatClass(entry);

    if (formatted) {
      formattedList.push(formatted);
    }
  }

  return { data: formattedList, meta: data?.meta || {} };
};

export const fetchAdminClassById = async (id) => {
  const { data } = await api.get(`users/classes/admin/${id}`);
  return data?.data ? formatClass(data.data) : null;
};

export const createAdminClass = async (payload, onUploadProgress) => {
  const { data } = await api.post("users/classes/admin", payload, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress ? { onUploadProgress } : {}),
  });
  return data?.data ? formatClass(data.data) : null;
};

export const updateAdminClass = async (id, payload) => {
  const { data } = await api.put(`users/classes/admin/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data ? formatClass(data.data) : null;
};

export const deleteAdminClass = async (id) => {
  await api.delete(`users/classes/admin/${id}`);
  return true;
};

export const permanentlyDeleteClass = async (id) => {
  const res = await api.delete(`users/classes/admin/${id}`);
  return res.data;
};

export const bulkDeleteClasses = async (ids) => {
  await api.post("users/classes/admin/bulk-delete", { ids });
  return true;
};

export const fetchAdminClassAnalytics = async (id) => {
  const { data } = await api.get(`users/classes/admin/${id}/analytics`);
  return data?.data ?? {};
};

export const toggleClassStatus = async (id) => {
  const { data } = await api.patch(`users/classes/admin/${id}/status`);
  return data?.data ? formatClass(data.data) : null;
};

export const approveAdminClass = async (id) => {
  const { data } = await api.patch(`users/classes/admin/${id}/approve`);
  return data?.data ? formatClass(data.data) : null;
};

export const rejectAdminClass = async (id, reason) => {
  const { data } = await api.patch(`users/classes/admin/${id}/reject`, { reason });
  return data?.data;
};

// Retrieve all students registered for a class
export const fetchClassStudents = async (id) => {
  const { data } = await api.get(`users/classes/admin/${id}/students`);
  return data?.data ?? [];
};

// Get enrollment details for a specific student
export const fetchClassStudent = async (classId, studentId) => {
  const { data } = await api.get(
    `users/classes/admin/${classId}/students/${studentId}`
  );
  return data?.data ?? null;
};
