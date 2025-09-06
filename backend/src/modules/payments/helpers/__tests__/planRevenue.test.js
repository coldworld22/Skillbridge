jest.mock('../../../../config/database.js', () => jest.fn());
jest.mock('../platformFee', () => ({
  calculatePlatformFee: jest.fn(),
}));

const db = require('../../../../config/database.js');
const { calculatePlatformFee } = require('../platformFee');
const { calculateInstructorAmount } = require('../planRevenue');

describe('calculateInstructorAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function mockDb() {
    const planUsageQuery = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ usage_count: 2 }),
      insert: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
    };
    const plansQuery = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ price_monthly: 100 }),
    };
    db.mockImplementation((table) => {
      if (table === 'plan_usage_metrics') return planUsageQuery;
      if (table === 'plans') return plansQuery;
    });
    return { planUsageQuery, plansQuery };
  }

  it('divides net plan revenue by usage count', async () => {
    mockDb();
    calculatePlatformFee.mockResolvedValueOnce({ instructor_amount: 80 });

    const amt = await calculateInstructorAmount('plan1', 'item1', 'class');
    expect(amt).toBeCloseTo(40);
  });

  it('returns 0 when plan not found', async () => {
    const planUsageQuery = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ usage_count: 2 }),
      insert: jest.fn().mockResolvedValue(),
      update: jest.fn().mockResolvedValue(),
    };
    const plansQuery = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(null),
    };
    db.mockImplementation((table) => {
      if (table === 'plan_usage_metrics') return planUsageQuery;
      if (table === 'plans') return plansQuery;
    });

    const amt = await calculateInstructorAmount('plan1', 'item1', 'class');
    expect(amt).toBe(0);
  });
});
