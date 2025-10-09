jest.mock('../src/config/database', () => {
  const mockFn = jest.fn();
  mockFn.fn = { now: jest.fn() };
  mockFn.transaction = jest.fn();
  return mockFn;
});

const db = require('../src/config/database');
const service = require('../src/modules/languages/languages.service');

describe('languages.service error handling', () => {
  const expectedError = expect.objectContaining({
    statusCode: 503,
    message:
      'Unable to access the language catalog. Please try again after the database connection is restored.',
  });

  beforeEach(() => {
    db.mockReset();
    db.fn = { now: jest.fn() };
    db.transaction.mockReset();
  });

  it('throws an AppError when listing languages fails', async () => {
    db.mockImplementation(() => {
      throw new Error('list failed');
    });

    await expect(service.list()).rejects.toEqual(expectedError);
  });

  it('throws an AppError when creating a language fails', async () => {
    db.transaction.mockImplementation(async () => {
      throw new Error('tx failed');
    });

    await expect(service.create({ name: 'English' })).rejects.toEqual(
      expectedError
    );
  });

  it('throws an AppError when fetching a language fails', async () => {
    db.mockImplementation(() => {
      throw new Error('lookup failed');
    });

    await expect(service.getById('123')).rejects.toEqual(expectedError);
  });

  it('throws an AppError when updating a language fails', async () => {
    db.transaction.mockImplementation(async () => {
      throw new Error('update failed');
    });

    await expect(service.update('123', { name: 'French' })).rejects.toEqual(
      expectedError
    );
  });

  it('throws an AppError when deleting a language fails', async () => {
    db.mockImplementation(() => {
      throw new Error('delete failed');
    });

    await expect(service.remove('123')).rejects.toEqual(expectedError);
  });
});
