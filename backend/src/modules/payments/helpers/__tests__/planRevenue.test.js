jest.mock('../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn();
  return db;
});

const db = require('../../../config/database');
const { calculateInstructorAmount } = require('../planRevenue');

describe('calculateInstructorAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies commission rate to usage amount', async () => {
    db.first
      .mockResolvedValueOnce({ amount: 100 })
      .mockResolvedValueOnce({ value: '0.2' });

    const amt = await calculateInstructorAmount('plan1', 'class1');
    expect(amt).toBeCloseTo(80);
    expect(db).toHaveBeenCalledWith('plan_usage_metrics');
    expect(db).toHaveBeenCalledWith('plan_features');
  });

  it('returns 0 when metrics missing', async () => {
    db.first.mockResolvedValueOnce(null);
    const amt = await calculateInstructorAmount('plan1', 'class1');
    expect(amt).toBe(0);
  });
});

