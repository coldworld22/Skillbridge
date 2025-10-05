export const sanitizeQuestions = (questions = []) =>
  questions
    .filter((q) => (q?.question || '').trim().length > 0)
    .map((q) => ({
      id: q.id,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      correct: typeof q.correct === 'number' ? q.correct : 0,
      points: typeof q.points === 'number' ? q.points : 0,
    }));

const appendFormDataValue = (formData, key, value) => {
  if (value === undefined || value === null) return;
  if (value instanceof Blob) {
    formData.append(key, value, value.name || 'upload');
    return;
  }
  if (typeof value === 'object') {
    formData.append(key, JSON.stringify(value));
    return;
  }
  formData.append(key, String(value));
};

export const prepareAssignmentPayload = ({
  title,
  description,
  dueDate,
  timeToFinish,
  type,
  questions,
  language,
  starterCode,
  allowLate,
  gradingRubric,
  resourceFile,
}) => {
  const basePayload = {
    title,
    description,
    due_date: dueDate,
    time_to_finish: timeToFinish || null,
    type,
    allow_late: Boolean(allowLate),
    grading_rubric: gradingRubric || null,
  };

  if (type === 'mcq') {
    basePayload.questions = sanitizeQuestions(questions);
  }

  if (type === 'code') {
    basePayload.coding = {
      language,
      starterCode,
    };
  }

  if (resourceFile) {
    const formData = new FormData();
    Object.entries(basePayload).forEach(([key, value]) =>
      appendFormDataValue(formData, key, value)
    );
    appendFormDataValue(formData, 'resource_file', resourceFile);
    return { payload: formData, isFormData: true };
  }

  return { payload: basePayload, isFormData: false };
};

export default prepareAssignmentPayload;
