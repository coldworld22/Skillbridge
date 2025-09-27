export const getPendingLessonEntries = (lessons = []) => {
  if (!Array.isArray(lessons)) {
    return [];
  }

  return lessons
    .map((lesson, index) => ({ lesson, index }))
    .filter(({ lesson }) => lesson?.status !== 'succeeded');
};
