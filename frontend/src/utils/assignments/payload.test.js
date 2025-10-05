import { prepareAssignmentPayload, sanitizeQuestions } from './payload';

describe('sanitizeQuestions', () => {
  it('removes empty questions and normalizes properties', () => {
    const result = sanitizeQuestions([
      { id: '1', question: '  ', options: [], correct: 0, points: 1 },
      { id: '2', question: 'Question?', options: ['A', 'B', 'C', 'D'], correct: 2, points: 3 },
      { id: '3', question: 'Another', options: 'invalid', correct: '1', points: '5' },
    ]);

    expect(result).toEqual([
      { id: '2', question: 'Question?', options: ['A', 'B', 'C', 'D'], correct: 2, points: 3 },
      { id: '3', question: 'Another', options: [], correct: 0, points: 0 },
    ]);
  });
});

describe('prepareAssignmentPayload', () => {
  const baseProps = {
    title: 'Quiz 1',
    description: 'Basics',
    dueDate: '2024-10-31',
    timeToFinish: '2h',
    allowLate: true,
    gradingRubric: 'Accuracy matters',
  };

  it('builds JSON payload for MCQ assignments', () => {
    const questions = [
      { id: 'q1', question: 'What?', options: ['A', 'B'], correct: 1, points: 5 },
    ];

    const { payload, isFormData } = prepareAssignmentPayload({
      ...baseProps,
      type: 'mcq',
      questions,
      language: 'javascript',
      starterCode: '',
      resourceFile: null,
    });

    expect(isFormData).toBe(false);
    expect(payload).toMatchObject({
      title: 'Quiz 1',
      description: 'Basics',
      type: 'mcq',
      allow_late: true,
      grading_rubric: 'Accuracy matters',
      due_date: '2024-10-31',
      time_to_finish: '2h',
    });
    expect(payload.questions).toEqual([
      { id: 'q1', question: 'What?', options: ['A', 'B'], correct: 1, points: 5 },
    ]);
  });

  it('builds FormData payload for coding assignments with uploads', () => {
    const file = new File(['print("Hello")'], 'starter.py', { type: 'text/x-python' });
    const { payload, isFormData } = prepareAssignmentPayload({
      ...baseProps,
      type: 'code',
      questions: [],
      language: 'python',
      starterCode: 'print("Hi")',
      resourceFile: file,
    });

    expect(isFormData).toBe(true);
    expect(payload instanceof FormData).toBe(true);
    expect(payload.get('title')).toBe('Quiz 1');
    expect(payload.get('type')).toBe('code');
    expect(JSON.parse(payload.get('coding'))).toEqual({
      language: 'python',
      starterCode: 'print("Hi")',
    });
    const uploadedFile = payload.get('resource_file');
    expect(uploadedFile).toBeInstanceOf(File);
    expect(uploadedFile.name).toBe('starter.py');
  });
});
