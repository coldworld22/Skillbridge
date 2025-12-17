jest.mock('../src/utils/logger.js', () => ({
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../src/config/database', () => {
  const error = new Error('relation "settings" does not exist');
  error.code = '42P01';
  const mockDb = jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockRejectedValue(error),
  }));
  mockDb.fn = { now: jest.fn(() => 'now()') };
  return mockDb;
});

const logger = require('../src/utils/logger.js');
const service = require('../src/modules/socialLoginConfig/socialLoginConfig.service');

describe('socialLoginConfigService.getSettings', () => {
  it('returns null when settings table is missing', async () => {
    const result = await service.getSettings();

    expect(result).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });
});

