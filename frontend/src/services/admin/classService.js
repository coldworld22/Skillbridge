import api from "@/services/api/api";
import { toDateInput } from "@/utils/date";
import { safeEncodeURI } from "@/utils/url";
import { computeScheduleStatus } from "@/utils/classSchedule";

const formatClass = (cls) => {
  const { status, ...rest } = cls;
  return {
    ...rest,
    publishStatus: status,
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
  };
};

export const fetchAdminClasses = async () => {
  const { data } = await api.get("/users/classes/admin");
  const list = data?.data ?? [];
  return list.map(formatClass);
};

export const fetchAdminClassById = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}`);
  return data?.data ? formatClass(data.data) : null;
};

export const createAdminClass = async (payload, onUploadProgress) => {
  const { data } = await api.post("/users/classes/admin", payload, {
    headers: { "Content-Type": "multipart/form-data" },
    ...(onUploadProgress ? { onUploadProgress } : {}),
  });
  return data?.data ? formatClass(data.data) : null;
};

export const updateAdminClass = async (id, payload) => {
  const { data } = await api.put(`/users/classes/admin/${id}`, payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data?.data ? formatClass(data.data) : null;
};

export const deleteAdminClass = async (id) => {
  await api.delete(`/users/classes/admin/${id}`);
  return true;
};

export const permanentlyDeleteClass = async (id) => {
  const res = await api.delete(`/users/classes/admin/${id}`);
  return res.data;
};

export const bulkDeleteClasses = async (ids) => {
  await api.post("/users/classes/admin/bulk-delete", { ids });
  return true;
};

export const fetchAdminClassAnalytics = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}/analytics`);
  return data?.data ?? {};
};

export const toggleClassStatus = async (id) => {
  const { data } = await api.patch(`/users/classes/admin/${id}/status`);
  return data?.data ? formatClass(data.data) : null;
};

export const approveAdminClass = async (id) => {
  const { data } = await api.patch(`/users/classes/admin/${id}/approve`);
  return data?.data ? formatClass(data.data) : null;
};

export const rejectAdminClass = async (id, reason) => {
  const { data } = await api.patch(`/users/classes/admin/${id}/reject`, { reason });
  return data?.data;
};

// Retrieve all students registered for a class
export const fetchClassStudents = async (id) => {
  const { data } = await api.get(`/users/classes/admin/${id}/students`);
  return data?.data ?? [];
};

// Get enrollment details for a specific student
export const fetchClassStudent = async (classId, studentId) => {
  const { data } = await api.get(
    `/users/classes/admin/${classId}/students/${studentId}`
  );
  return data?.data ?? null;
};
