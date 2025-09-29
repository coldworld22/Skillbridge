jest.mock('axios');
jest.mock('../../src/config/database', () => jest.fn());

const axios = require('axios');
const db = require('../../src/config/database');

const { validatePurchaseCode } = require('../../src/services/licenseService');

describe('licenseService.validatePurchaseCode', () => {
  const demoCode = 'DEMO-CODE-1234';

  beforeEach(() => {
    jest.clearAllMocks();
    db.mockReset();
    delete process.env.ENVATO_TOKEN;
  });

  it('returns Envato verification success with persisted license id', async () => {
    process.env.ENVATO_TOKEN = 'token-123';

    axios.get.mockResolvedValue({
      data: {
        item: { id: 1 },
        buyer_email: 'buyer@example.com',
      },
    });

    const firstLookup = jest.fn().mockResolvedValue(null);
    const firstWhere = jest.fn().mockReturnValue({ first: firstLookup });
    db.mockImplementationOnce(() => ({ where: firstWhere }));

    const insert = jest.fn().mockResolvedValue([1]);
    db.mockImplementationOnce(() => ({ insert }));

    const finalLookup = jest.fn().mockResolvedValue({ id: 987 });
    const finalWhere = jest.fn().mockReturnValue({ first: finalLookup });
    db.mockImplementationOnce(() => ({ where: finalWhere }));

    const result = await validatePurchaseCode('CODE-123', 'example.com');

    expect(result).toEqual({
      valid: true,
      message: 'License verified with Envato',
      licenseId: 987,
    });
    expect(axios.get).toHaveBeenCalledWith(
      'https://api.envato.com/v3/market/author/sale?code=CODE-123',
      { headers: { Authorization: 'Bearer token-123' } },
    );
    expect(firstWhere).toHaveBeenCalledWith({ purchase_code: 'CODE-123' });
    expect(insert).toHaveBeenCalledWith({
      purchase_code: 'CODE-123',
      domain: 'example.com',
      email: 'buyer@example.com',
      status: 'active',
      verified_at: expect.any(Date),
    });
    expect(finalWhere).toHaveBeenCalledWith({ purchase_code: 'CODE-123' });
  });

  it('returns demo license success with persisted license id when envato token missing', async () => {
    const firstLookup = jest.fn().mockResolvedValue(null);
    const firstWhere = jest.fn().mockReturnValue({ first: firstLookup });
    db.mockImplementationOnce(() => ({ where: firstWhere }));

    const insert = jest.fn().mockResolvedValue([1]);
    db.mockImplementationOnce(() => ({ insert }));

    const finalLookup = jest.fn().mockResolvedValue({ id: 456 });
    const finalWhere = jest.fn().mockReturnValue({ first: finalLookup });
    db.mockImplementationOnce(() => ({ where: finalWhere }));

    const result = await validatePurchaseCode(demoCode, 'demo.example.com');

    expect(result).toEqual({
      valid: true,
      message: 'Demo license accepted',
      licenseId: 456,
    });
    expect(axios.get).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith({
      purchase_code: demoCode,
      domain: 'demo.example.com',
      email: 'license@placeholder.invalid',
      status: 'active',
      verified_at: expect.any(Date),
    });
  });
});
