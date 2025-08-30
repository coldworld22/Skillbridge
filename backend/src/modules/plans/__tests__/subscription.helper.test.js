jest.mock('../../../config/database', () => {
  const db = jest.fn(() => db);
  db.join = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn();
  return db;
});

const db = require('../../../config/database');
const { hasActiveStudentSubscription } = require('../subscription.helper');

describe('hasActiveStudentSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true for active student subscription', async () => {
    db.first.mockResolvedValue({ end_date: new Date(Date.now() + 86400000) });
    const result = await hasActiveStudentSubscription('user1');
    expect(result).toBe(true);
    expect(db.join).toHaveBeenCalledWith('plans as p', 'us.plan_id', 'p.id');
    expect(db.where).toHaveBeenCalledWith('p.target_role', 'student');
  });

  it('returns false for instructor-only subscription', async () => {
    db.first.mockResolvedValue(null);
    const result = await hasActiveStudentSubscription('user1');
    expect(result).toBe(false);
  });
});
