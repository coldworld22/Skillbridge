jest.mock('../../../config/database', () => {
  const db = jest.fn(() => db);
  db.join = jest.fn(() => db);
  db.select = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn();
  return db;
});

const db = require('../../../config/database');
const { getActiveInstructorPlan } = require('../instructor.helper');

describe('getActiveInstructorPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns plan for active instructor subscription', async () => {
    db.first.mockResolvedValue({ id: 'plan1', max_courses: 5 });
    const plan = await getActiveInstructorPlan('user1');
    expect(plan).toEqual({ id: 'plan1', max_courses: 5 });
    expect(db.join).toHaveBeenCalledWith('plans as p', 'us.plan_id', 'p.id');
    expect(db.where).toHaveBeenCalledWith('p.target_role', 'instructor');
  });

  it('returns null when no active subscription', async () => {
    db.first.mockResolvedValue(null);
    const plan = await getActiveInstructorPlan('user1');
    expect(plan).toBeNull();
  });
});

