import api from "@/services/api/api";
import { extractData } from "@/services/api/helpers";

const RAW_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const API_BASE =
  typeof RAW_API_BASE === "string" ? RAW_API_BASE.replace(/\/$/, "") : "";

const toAbsoluteUrl = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (!API_BASE) return url;
  const needsSlash = url.startsWith("/") ? "" : "/";
  return `${API_BASE}${needsSlash}${url}`;
};

const normalizeSubmission = (payload) => {
  if (!payload) return null;
  const normalizedGrade =
    payload.grade === null || payload.grade === undefined
      ? null
      : Number.isNaN(Number(payload.grade))
      ? null
      : Number(payload.grade);
  return {
    id: payload.id,
    fileUrl: payload.file_url || null,
    fileDownloadUrl: toAbsoluteUrl(payload.file_url),
    textAnswer: payload.text_answer || "",
    grade: normalizedGrade,
    createdAt: payload.created_at || null,
    updatedAt: payload.updated_at || null,
    submittedAt: payload.updated_at || payload.created_at || null,
  };
};

const normalizeAssignmentDetail = (payload) => {
  if (!payload) return { assignment: null, submission: null, source: null };
  const { assignment = {}, submission = null } = payload;
  const source =
    payload.source ||
    (assignment.class_id ? "class" : assignment.tutorial_id ? "tutorial" : null);

  const parentTitle = assignment.class_title || assignment.tutorial_title || null;
  const parentDescription =
    assignment.class_description || assignment.tutorial_description || null;
  const coverImage =
    assignment.class_cover_image || assignment.tutorial_cover_image || null;

  return {
    source,
    assignment: {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.due_date || assignment.dueDate || null,
      parentId: assignment.class_id || assignment.tutorial_id || null,
      parentTitle,
      parentDescription,
      coverImage: toAbsoluteUrl(coverImage),
      instructorId: assignment.instructor_id || null,
      instructorName: assignment.instructor_name || null,
    },
    submission: normalizeSubmission(submission),
  };
};

export const fetchStudentAssignmentDetail = async (assignmentId) => {
  if (!assignmentId) {
    throw new Error("Assignment id is required");
  }

  let lastError = null;
  try {
    const res = await api.get(`/users/classes/assignments/${assignmentId}`);
    return normalizeAssignmentDetail(extractData(res));
  } catch (err) {
    lastError = err;
    if (err?.response?.status !== 404) {
      throw err;
    }
  }

  try {
    const res = await api.get(
      `/users/tutorials/assignments/item/${assignmentId}`
    );
    return normalizeAssignmentDetail(extractData(res));
  } catch (err) {
    throw err ?? lastError ?? new Error("Assignment not found");
  }
};

export const submitStudentAssignment = async ({
  assignmentId,
  source = "class",
  textAnswer,
  file,
}) => {
  if (!assignmentId) {
    throw new Error("Assignment id is required");
  }
  const trimmedAnswer =
    typeof textAnswer === "string" ? textAnswer.trim() : "";
  if (!trimmedAnswer && !file) {
    throw new Error("Please provide an answer or upload a file.");
  }
  const formData = new FormData();
  if (trimmedAnswer) {
    formData.append("text_answer", trimmedAnswer);
  }
  if (file) {
    formData.append("file", file);
  }

  const normalizedSource =
    typeof source === "string" && source.toLowerCase() === "tutorial"
      ? "tutorial"
      : "class";

  const endpoint =
    normalizedSource === "tutorial"
      ? `/users/tutorials/assignments/submissions/assignment/${assignmentId}`
      : `/users/classes/assignments/submissions/assignment/${assignmentId}`;

  const res = await api.post(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return normalizeSubmission(extractData(res));
};
