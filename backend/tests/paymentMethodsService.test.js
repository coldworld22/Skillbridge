jest.mock('../src/config/database', () => {
  const fn = jest.fn();
  fn.raw = jest.fn();
  fn.transaction = jest.fn();
  return fn;
});

const db = require('../src/config/database');
const service = require('../src/modules/paymentMethods/paymentMethods.service');

beforeEach(() => {
  jest.clearAllMocks();
});

test('getByType matches payment method type case-insensitively', async () => {
  const builder = {
    whereRaw: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: 'm-bank', type: 'BANK' }),
  };

  db.mockImplementationOnce(() => builder);

  const result = await service.getByType('bank');

  expect(db).toHaveBeenCalledWith('payment_methods_config');
  expect(builder.whereRaw).toHaveBeenCalledWith('LOWER(type) = ?', 'bank');
  expect(result).toEqual({ id: 'm-bank', type: 'BANK' });
});

test('getByType falls back to matching by name when type differs', async () => {
  const typeBuilder = {
    whereRaw: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null),
  };
  const nameBuilder = {
    whereRaw: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: 'm-name', name: 'Bank Transfer' }),
  };

  db
    .mockImplementationOnce(() => typeBuilder)
    .mockImplementationOnce(() => nameBuilder);

  const result = await service.getByType('bank transfer');

  expect(db).toHaveBeenCalledTimes(2);
  expect(typeBuilder.whereRaw).toHaveBeenCalledWith('LOWER(type) = ?', 'bank transfer');
  expect(nameBuilder.whereRaw).toHaveBeenCalledWith('LOWER(name) = ?', 'bank transfer');
  expect(result).toEqual({ id: 'm-name', name: 'Bank Transfer' });
});

test('getByType returns null when provided an empty identifier', async () => {
  const result = await service.getByType('   ');
  expect(result).toBeNull();
  expect(db).not.toHaveBeenCalled();
});
