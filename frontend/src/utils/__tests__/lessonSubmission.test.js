import { getPendingLessonEntries } from '@/utils/lessonSubmission';

describe('getPendingLessonEntries', () => {
  it('returns only lessons that are not marked as succeeded', () => {
    const lessons = [
      { id: 'a', status: 'succeeded' },
      { id: 'b', status: 'failed' },
      { id: 'c', status: 'pending' },
      { id: 'd' },
    ];

    const result = getPendingLessonEntries(lessons);

    expect(result).toEqual([
      { lesson: lessons[1], index: 1 },
      { lesson: lessons[2], index: 2 },
      { lesson: lessons[3], index: 3 },
    ]);
  });

  it('returns an empty array when input is not an array', () => {
    expect(getPendingLessonEntries(null)).toEqual([]);
    expect(getPendingLessonEntries(undefined)).toEqual([]);
  });
});
