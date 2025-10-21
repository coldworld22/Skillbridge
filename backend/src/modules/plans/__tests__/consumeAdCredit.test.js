jest.mock('../../../config/database', () => {
  const usage = new Map();

  const makeKey = ({ plan_id, item_type, item_id }) =>
    `${plan_id}|${item_type}|${item_id}`;

  const builder = (table) => {
    if (table !== 'plan_usage_metrics') {
      throw new Error(`Unexpected table ${table}`);
    }

    return {
      where(criteria) {
        const key = makeKey(criteria);
        return {
          async first() {
            const row = usage.get(key);
            return row ? { ...row } : undefined;
          },
          async update(values) {
            if (!usage.has(key)) return 0;
            usage.set(key, { ...usage.get(key), ...values });
            return 1;
          },
        };
      },
      async insert(payload) {
        const entry = Array.isArray(payload) ? payload[0] : payload;
        const key = makeKey(entry);
        usage.set(key, { ...entry });
        return [entry];
      },
    };
  };

  builder.transaction = jest.fn();
  builder.__usage = usage;
  builder.__makeKey = makeKey;
  return builder;
});

const db = require('../../../config/database');
const {
  consumeAdCredit,
  getAdCreditUsage,
  getRemainingAdCredits,
} = require('../plans.service');

describe('ad credit consumption', () => {
  const planId = 'plan-1';
  const userId = 'user-1';
  const plan = { id: planId, ad_credits: 2 };

  beforeEach(() => {
    db.__usage.clear();
  });

  it('consumes a credit when allowance remains', async () => {
    const result = await consumeAdCredit({
      planId,
      userId,
      allowance: 2,
    });

    expect(result).toEqual({ consumed: true, remaining: 1 });
    const used = await getAdCreditUsage(planId, userId);
    expect(used).toBe(1);
  });

  it('prevents consumption once allowance exhausted', async () => {
    await consumeAdCredit({ planId, userId, allowance: 1 });
    const second = await consumeAdCredit({ planId, userId, allowance: 1 });

    expect(second).toEqual({ consumed: false, remaining: 0 });
    const used = await getAdCreditUsage(planId, userId);
    expect(used).toBe(1);
  });

  it('returns remaining credits for a plan', async () => {
    await consumeAdCredit({ planId, userId, allowance: 2 });
    const remaining = await getRemainingAdCredits(plan, userId);

    expect(remaining).toBe(1);
  });

  it('ignores requests without identifiers', async () => {
    const result = await consumeAdCredit();
    expect(result).toEqual({ consumed: false, remaining: null });
    expect(db.__usage.size).toBe(0);
  });
});
