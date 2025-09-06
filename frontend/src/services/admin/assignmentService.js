import api from "@/services/api/api";

export const fetchAllAssignments = async () => {
  const { data } = await api.get("/users/classes/assignments/admin");
  return data?.data ?? [];
};

export const fetchAssignmentById = async (id) => {
  const { data } = await api.get(`/users/classes/assignments/admin/${id}`);
  const a = data?.data;
  if (!a) return null;
  return {
    id: a.id,
    title: a.title,
    instructor: a.instructor,
    className: a.class_title,
    type: a.type,
    allowLate: a.allow_late,
    dueDate: a.due_date,
    gradingRubric: a.grading_rubric,
    questions: a.questions || [],
    status: a.status,
  };
};

export const approveAssignment = async (id, note) => {
  const payload = note ? { note } : {};
  const { data } = await api.patch(
    `/users/classes/assignments/admin/${id}/approve`,
    payload
  );
  return data?.data;
};

export const rejectAssignment = async (id, reason) => {
  const { data } = await api.patch(
    `/users/classes/assignments/admin/${id}/reject`,
    { reason }
  );
  return data?.data;
};
