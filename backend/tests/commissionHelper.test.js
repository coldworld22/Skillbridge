jest.mock('../src/config/database', () => {
  const { newDb } = require('pg-mem');
  return newDb().adapters.createKnex();
});
const mockPlanService = { getPlanById: jest.fn() };
jest.mock('../src/modules/plans/plans.service', () => mockPlanService);

const db = require('../src/config/database');
const { getCommissionRate } = require('../src/modules/payments/commission.helper');

describe('commission helper', () => {
  beforeAll(async () => {
    await db.schema.createTable('online_classes', t => {
      t.uuid('id').primary();
      t.uuid('instructor_id');
    });
    await db.schema.createTable('users', t => {
      t.uuid('id').primary();
      t.uuid('plan_id');
    });
    await db('online_classes').insert({ id: '11111111-1111-1111-1111-111111111111', instructor_id: '22222222-2222-2222-2222-222222222222' });
    await db('users').insert({ id: '22222222-2222-2222-2222-222222222222', plan_id: '33333333-3333-3333-3333-333333333333' });
  });

  it('returns commission rate from plan features', async () => {
    mockPlanService.getPlanById.mockResolvedValue({ features: [ { feature_key: 'commission_rate', value: '20' } ] });
    const rate = await getCommissionRate('class', '11111111-1111-1111-1111-111111111111');
    expect(rate).toBe(20);
  });
});
