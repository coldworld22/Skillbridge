jest.mock('../src/config/database', () => {
  const mockFn = jest.fn();
  mockFn.fn = { now: jest.fn() };
  mockFn.transaction = jest.fn();
  return mockFn;
});

const db = require('../src/config/database');
const AppError = require('../src/utils/AppError');

// Require after the database module is mocked so it picks up the mock instance
const service = require('../src/modules/appConfig/appConfig.service');

describe('appConfig.service error handling', () => {
  beforeEach(() => {
    db.mockReset();
    db.fn = { now: jest.fn() };
    db.transaction.mockReset();
  });

  it('wraps database read failures in an AppError', async () => {
    const dbError = new Error('connection refused');
    db.mockImplementation(() => {
      throw dbError;
    });

    await expect(service.getSettings()).rejects.toEqual(
      expect.objectContaining({
        statusCode: 503,
        message:
          'Unable to load application settings. Please verify the database connection.',
      })
    );
  });

  it('wraps database write failures in an AppError', async () => {
    const dbError = new Error('write failed');
    db.mockImplementation(() => {
      throw dbError;
    });

    await expect(service.updateSettings({ theme: 'dark' })).rejects.toEqual(
      expect.objectContaining({
        statusCode: 503,
        message:
          'Unable to update application settings. Please retry after the database connection is restored.',
      })
    );
  });
});
