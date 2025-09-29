const axios = require('axios');

jest.mock('axios');

jest.mock('../../src/config/database', () => {
  const mockInsert = jest.fn(() => Promise.resolve());
  const mockDb = jest.fn(() => ({
    where: jest.fn(() => ({
      first: jest.fn(() => Promise.resolve(mockDb.__firstQueue.shift() ?? null)),
      update: jest.fn(() => Promise.resolve()),
    })),
    insert: mockInsert,
  }));

  Object.assign(mockDb, {
    __firstQueue: [],
    __setFirstQueue(values) {
      mockDb.__firstQueue = [...values];
    },
    __getInsertMock() {
      return mockInsert;
    },
    __reset() {
      mockDb.mockClear();
      mockInsert.mockClear();
      mockDb.__firstQueue = [];
    },
  });

  return mockDb;
});
const db = require('../../src/config/database');
const { validatePurchaseCode } = require('../../src/services/licenseService');

describe('licenseService.validatePurchaseCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.__reset();
    delete process.env.ENVATO_TOKEN;
  });

  it('returns Envato verification payload including persisted licenseId', async () => {
    process.env.ENVATO_TOKEN = 'test-token';
    db.__setFirstQueue([null, { id: 123 }]);
    axios.get.mockResolvedValue({
      data: {
        item: { id: 1 },
        buyer_email: 'buyer@example.com',
      },
    });

    const result = await validatePurchaseCode('CODE-123', 'example.com', { persist: true });

    expect(result).toEqual({
      valid: true,
      message: 'License verified with Envato',
      licenseId: 123,
    });
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('CODE-123'),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-token' } })
    );
    expect(db.__getInsertMock()).toHaveBeenCalledWith(
      expect.objectContaining({
        purchase_code: 'CODE-123',
        domain: 'example.com',
        email: 'buyer@example.com',
      })
    );
  });

  it('returns demo license payload including persisted licenseId', async () => {
    db.__setFirstQueue([null, { id: 456 }]);

    const result = await validatePurchaseCode('DEMO-CODE-1234', 'demo.example', { persist: true });

    expect(result).toEqual({
      valid: true,
      message: 'Demo license accepted',
      licenseId: 456,
    });
    expect(axios.get).not.toHaveBeenCalled();
    expect(db.__getInsertMock()).toHaveBeenCalledWith(
      expect.objectContaining({
        purchase_code: 'DEMO-CODE-1234',
        domain: 'demo.example',
        email: 'license@placeholder.invalid',
      })
    );
  });
})
