jest.mock('../../../../config/database', () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn();
  return db;
});

const db = require('../../../../config/database');
const AppError = require('../../../../utils/AppError.js');
const { getPlanCoveredMethod } = require('../methods.js');

describe('getPlanCoveredMethod', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns subscription method when available', async () => {
    const method = { id: 'sub', type: 'subscription' };
    db.first.mockResolvedValueOnce(method);

    const result = await getPlanCoveredMethod();

    expect(result).toEqual(method);
    expect(db).toHaveBeenCalledWith('payment_methods_config');
    expect(db.where).toHaveBeenCalledWith({ type: 'subscription' });
    expect(db.first).toHaveBeenCalledTimes(1);
  });

  it('falls back to free method when subscription not found', async () => {
    db.first
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'free', type: 'free' });

    const result = await getPlanCoveredMethod();

    expect(result).toEqual({ id: 'free', type: 'free' });
    expect(db.where).toHaveBeenNthCalledWith(1, { type: 'subscription' });
    expect(db.where).toHaveBeenNthCalledWith(2, { type: 'free' });
    expect(db.first).toHaveBeenCalledTimes(2);
  });

  it('throws when no subscription or free method configured', async () => {
    db.first.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await expect(getPlanCoveredMethod()).rejects.toMatchObject({
      message: 'Subscription payment method not configured',
      statusCode: 500,
    });
  });

  it('uses transaction client when provided', async () => {
    const trx = jest.fn(() => trx);
    trx.where = jest.fn(() => trx);
    trx.first = jest.fn().mockResolvedValue({ id: 'trx-sub', type: 'subscription' });

    const result = await getPlanCoveredMethod(trx);

    expect(result).toEqual({ id: 'trx-sub', type: 'subscription' });
    expect(trx).toHaveBeenCalledWith('payment_methods_config');
    expect(db).not.toHaveBeenCalled();
  });
});
