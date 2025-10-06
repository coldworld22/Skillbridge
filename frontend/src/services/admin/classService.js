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

const toDisplayString = (value, seen = new Set()) => {
  if (value == null) {
    return "";
  }

  if (seen.has(value)) {
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
    seen.add(value);

    if (value instanceof Date) {
      return value.toISOString();
    }

    for (const key of DISPLAY_FALLBACK_KEYS) {
      if (key in value && value[key] != null) {
        const nested = toDisplayString(value[key], seen);
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

const DATE_VALUE_KEYS = [
  "date",
  "start",
  "start_date",
  "startDate",
  "end",
  "end_date",
  "endDate",
  "value",
  "iso",
  "timestamp",
];

const resolveDateLikeValue = (candidate, seen = new Set()) => {
  if (candidate == null) {
    return null;
  }

  if (candidate instanceof Date) {
    return candidate;
  }

  if (typeof candidate === "string") {
    const trimmed = candidate.trim();
    return trimmed || null;
  }

  if (typeof candidate === "number") {
    if (!Number.isFinite(candidate)) {
      return null;
    }
    return new Date(candidate);
  }

  if (typeof candidate === "object") {
    if (seen.has(candidate)) {
      return null;
    }
    seen.add(candidate);

    for (const key of DATE_VALUE_KEYS) {
      if (key in candidate) {
        const nested = resolveDateLikeValue(candidate[key], seen);
        if (nested) {
          return nested;
        }
      }
    }

    return toDisplayString(candidate, seen) || null;
  }

  return null;
};

const normalizeDateField = (value) => {
  const resolved = resolveDateLikeValue(value);

  if (!resolved) {
    return { display: "", input: "", iso: null };
  }

  if (resolved instanceof Date) {
    if (Number.isNaN(resolved.getTime())) {
      return { display: "", input: "", iso: null };
    }
    const isoString = resolved.toISOString();
    return {
      display: isoString,
      input: isoString.split("T")[0],
      iso: isoString,
    };
  }

  if (typeof resolved === "string") {
    const trimmed = resolved.trim();
    if (!trimmed) {
      return { display: "", input: "", iso: null };
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return { display: trimmed, input: "", iso: null };
    }

    return {
      display: trimmed,
      input: parsed.toISOString().split("T")[0],
      iso: parsed.toISOString(),
    };
  }

  return { display: "", input: "", iso: null };
};

const normalizeStatus = (value, fallback = "") => {
  const normalized = toDisplayString(value);
  return normalized || fallback;
};

const normalizeNonNegativeNumber = (value, fallback = 0) => {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return fallback;
    }
    return value < 0 ? fallback : value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.+-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed < 0 ? fallback : parsed;
    }
    return fallback;
  }

  if (typeof value === "object") {
    for (const key of ["value", "amount", "total", "count"]) {
      if (key in value) {
        return normalizeNonNegativeNumber(value[key], fallback);
      }
    }
  }

  return fallback;
};

const formatClass = (cls) => {
  if (!cls || typeof cls !== "object") {
    return null;
  }

  const { status, schedule_status, ...rest } = cls;
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

  const startDate = normalizeDateField(
    cls.start_date ??
      cls.startDate ??
      cls.schedule?.start_date ??
      cls.schedule?.startDate ??
      cls.schedule?.start ??
      cls.schedule_start_date ??
      cls.scheduleStartDate
  );
  const endDate = normalizeDateField(
    cls.end_date ??
      cls.endDate ??
      cls.schedule?.end_date ??
      cls.schedule?.endDate ??
      cls.schedule?.end ??
      cls.schedule_end_date ??
      cls.scheduleEndDate
  );

  const priceValue = normalizeNonNegativeNumber(cls.price, 0);
  const viewsValue = normalizeNonNegativeNumber(cls.views, 0);
  const publishStatus = normalizeStatus(status, "draft");
  const approvalStatus = normalizeStatus(cls.moderation_status, "Pending");
  const scheduleStatus =
    normalizeStatus(schedule_status) ||
    computeScheduleStatus(startDate.iso || startDate.display, endDate.iso || endDate.display);

  return {
    ...rest,
    title,
    instructor,
    category,
    publishStatus,
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

    start_date: startDate.display || null,
    end_date: endDate.display || null,

    startDateInput: startDate.display ? toDateInput(startDate.display) : "",
    endDateInput: endDate.display ? toDateInput(endDate.display) : "",

    approvalStatus,
    scheduleStatus,
    views: viewsValue,
    price: Number(priceValue.toFixed(2)),
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
