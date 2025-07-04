import api from "@/services/api/api";
import { API_BASE_URL } from "@/config/config";

const formatBase = (tut) => ({
  ...tut,
  thumbnail: tut.thumbnail_url
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${tut.thumbnail_url}`
    : null,
  preview: tut.preview_video
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL}${tut.preview_video}`
    : null,
  instructor: tut.instructor_name || tut.instructor,
  tags: tut.tags || [],
});

const mapStatus = (tut) =>
  tut.status === "draft"
    ? "Draft"
    : tut.moderation_status === "Approved"
    ? "Approved"
    : tut.moderation_status === "Rejected"
    ? "Rejected"
    : "Submitted";

export const fetchInstructorTutorials = async () => {
  const { data } = await api.get("/users/tutorials/admin/my");
  const list = data?.data ?? [];
  return list.map((t) => ({
    ...formatBase(t),
    status: mapStatus(t),
    updatedAt: t.updated_at,
    createdAt: t.created_at,
    views: t.views || 0,
    rating: t.rating || 0,
    enrollments: t.enrollments || 0,
    comments: t.comment_count || 0,
    watchTime: t.watch_time || 0,
  }));
};

export const fetchInstructorTutorialById = async (id) => {
  const { data } = await api.get(`/users/tutorials/admin/${id}`);
  const tut = data?.data;
  if (!tut) return null;
  const { data: chData } = await api.get(
    `/users/tutorials/chapters/tutorial/${id}`
  );
  const chapters = chData?.data || [];
  return {
    ...formatBase(tut),
    status: mapStatus(tut),
    updatedAt: tut.updated_at,
    createdAt: tut.created_at,
    views: tut.views || 0,
    rating: tut.rating || 0,
    enrollments: tut.enrollments || 0,
    comments: tut.comment_count || 0,
    watchTime: tut.watch_time || 0,
    rejection_reason: tut.rejection_reason,
    progress: tut.progress,
    chapters,
  };
};

export const submitTutorialForReview = async (id) => {
  const { data } = await api.patch(`/users/tutorials/admin/${id}/status`);
  return data?.data;
};
