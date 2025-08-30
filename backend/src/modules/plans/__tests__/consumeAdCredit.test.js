jest.mock('../../../config/database', () => {
  const plans = { 1: { ad_credits: 1 }, 2: { ad_credits: 0 } };
  const db = jest.fn(() => ({
    where: jest.fn(({ id }) => ({
      andWhere: jest.fn((column, operator, threshold) => ({
        decrement: jest.fn((col, amount) => {
          const plan = plans[id];
          if (plan && plan.ad_credits > threshold) {
            plan.ad_credits -= amount;
          }
          return Promise.resolve();
        }),
      })),
    })),
  }));
  db.__plans = plans;
  return db;
});

const db = require('../../../config/database');
const { consumeAdCredit } = require('../plans.service');

describe('consumeAdCredit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.__plans[1].ad_credits = 1;
    db.__plans[2].ad_credits = 0;
  });

  it('decrements ad_credits when positive', async () => {
    await consumeAdCredit(1);
    expect(db.__plans[1].ad_credits).toBe(0);
  });

  it('does not decrement when ad_credits is zero', async () => {
    await consumeAdCredit(2);
    expect(db.__plans[2].ad_credits).toBe(0);
  });

  it('does nothing if planId is missing', async () => {
    await consumeAdCredit();
    expect(db).not.toHaveBeenCalled();
  });

  it('does not decrement below zero', async () => {
    await consumeAdCredit(1);
    await consumeAdCredit(1);
    expect(db.__plans[1].ad_credits).toBe(0);
  });
});

