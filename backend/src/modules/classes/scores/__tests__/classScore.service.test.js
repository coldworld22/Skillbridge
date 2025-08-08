jest.mock('../../../../config/database', () => jest.fn());

const db = require('../../../../config/database');
const service = require('../classScore.service');

describe('calculateForClass', () => {
  beforeEach(() => {
    db.mockReset();
  });

  it('resolves all student scores and captures errors', async () => {
    const enrollments = [
      { user_id: 's1', full_name: 'Student One' },
      { user_id: 's2', full_name: 'Student Two' },
    ];

    db.mockImplementation(() => ({
      join: () => ({
        where: () => ({
          select: () => Promise.resolve(enrollments),
        }),
      }),
    }));

    const original = service.calculateForStudent;
    service.calculateForStudent = jest
      .fn()
      .mockResolvedValueOnce({ total_score: 80 })
      .mockRejectedValueOnce(new Error('failure'));

    const results = await service.calculateForClass('class1');

    expect(results).toEqual([
      { total_score: 80, student_id: 's1', full_name: 'Student One' },
      { student_id: 's2', full_name: 'Student Two', error: 'failure' },
    ]);

    service.calculateForStudent = original;
  });
});
