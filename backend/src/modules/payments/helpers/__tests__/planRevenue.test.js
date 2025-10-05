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

    const amt = await calculateInstructorAmount('plan1', 'sub1', 'item1');

    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: 'plan1',
        subscription_id: 'sub1',
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

  it('adds a new payout on subsequent enrollments for the same subscription', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 2, instructor_amount: 140 })
      .mockResolvedValueOnce({ price_monthly: 100 });
    db.select.mockResolvedValueOnce([
      { feature_key: 'commission_rate', value: '0.3' },
    ]);

    const amt = await calculateInstructorAmount('plan1', 'sub1', 'item1');

    expect(amt).toBeCloseTo(70);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ usage_count: 3, instructor_amount: 210 })
    );
  });

  it('falls back to platform fee when commission is absent', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 5, instructor_amount: 80 })
      .mockResolvedValueOnce({ price_monthly: 120 });
    db.select.mockResolvedValueOnce([]);
    calculatePlatformFee.mockResolvedValueOnce({ instructor_amount: 80 });

    const amt = await calculateInstructorAmount('plan2', 'sub2', 'item2');

    expect(calculatePlatformFee).toHaveBeenCalledWith('class', 120);
    expect(amt).toBe(80);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ usage_count: 6, instructor_amount: 160 })
    );
  });

  it('uses a precomputed instructor amount when provided', async () => {
    db.first
      .mockResolvedValueOnce({ usage_count: 1, instructor_amount: 55 })
      .mockResolvedValueOnce({ price_monthly: 200 });
    db.select.mockResolvedValueOnce([{ feature_key: 'commission_rate', value: '0.25' }]);

    const amt = await calculateInstructorAmount('plan4', 'sub4', 'item4', undefined, 'book', {
      precomputedAmount: 12.5,
    });

    expect(amt).toBeCloseTo(12.5);
    expect(calculatePlatformFee).not.toHaveBeenCalled();
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({ usage_count: 2, instructor_amount: 67.5 })
    );
  });

  it('isolates payouts per subscription for the same plan', async () => {
    db.first
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ price_monthly: 100 })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ price_monthly: 100 });
    db.select
      .mockResolvedValueOnce([{ feature_key: 'commission_rate', value: '0.3' }])
      .mockResolvedValueOnce([{ feature_key: 'commission_rate', value: '0.3' }]);

    const first = await calculateInstructorAmount('plan3', 'subA', 'item9');
    const second = await calculateInstructorAmount('plan3', 'subB', 'item9');

    expect(first).toBeCloseTo(70);
    expect(second).toBeCloseTo(70);
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: 'plan3',
        subscription_id: 'subA',
        item_id: 'item9',
      })
    );
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: 'plan3',
        subscription_id: 'subB',
        item_id: 'item9',
      })
    );
  });
});
