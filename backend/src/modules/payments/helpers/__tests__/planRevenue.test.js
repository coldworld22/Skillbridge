jest.mock('../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn();
  db.insert = jest.fn(() => db);
  db.update = jest.fn(() => db);
  db.select = jest.fn();
  db.forUpdate = jest.fn(() => db);
  return db;
});

jest.mock('../platformFee', () => ({
  calculatePlatformFee: jest.fn(() => ({ instructor_amount: 80 })),
}));

const db = require('../../../../config/database');
const { calculateInstructorAmount } = require('../planRevenue');
const { calculatePlatformFee } = require('../platformFee');

describe('calculateInstructorAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates metrics row and returns full net amount on first credit', async () => {
    db.first
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ price_monthly: 100 });
    db.select.mockResolvedValueOnce([
      { feature_key: 'commission_rate', value: '0.3' },
    ]);

    const amt = await calculateInstructorAmount('plan1', 'item1');

    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: 'plan1',
        item_type: 'class',
        item_id: 'item1',
        usage_count: 0,
        instructor_amount: 0,
      })
    );
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ usage_count: 1, instructor_amount: 70 })
    );
    expect(amt).toBeCloseTo(70);
    expect(calculatePlatformFee).not.toHaveBeenCalled();
  });

  it('returns delta when partial amount already credited', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 2, instructor_amount: 20 })
      .mockResolvedValueOnce({ price_monthly: 100 });
    db.select.mockResolvedValueOnce([
      { feature_key: 'commission_rate', value: '0.3' },
    ]);

    const amt = await calculateInstructorAmount('plan1', 'item1');

    expect(amt).toBeCloseTo(50);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ usage_count: 3, instructor_amount: 70 })
    );
  });

  it('falls back to platform fee and returns 0 when fully credited', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 5, instructor_amount: 80 })
      .mockResolvedValueOnce({ price_monthly: 120 });
    db.select.mockResolvedValueOnce([]);
    calculatePlatformFee.mockResolvedValueOnce({ instructor_amount: 80 });

    const amt = await calculateInstructorAmount('plan2', 'item2');

    expect(calculatePlatformFee).toHaveBeenCalledWith('class', 120);
    expect(amt).toBe(0);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ usage_count: 6, instructor_amount: 80 })
    );
  });
});
