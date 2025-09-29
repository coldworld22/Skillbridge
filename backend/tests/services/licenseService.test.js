jest.mock('../../src/config/database', () => {
  const records = new Map();
  let idCounter = 1;

  const dbFn = jest.fn((table) => {
    if (table !== 'licenses') {
      throw new Error(`Unexpected table ${table}`);
    }

    return {
      where: jest.fn((conditions) => {
        const entries = [...records.values()].filter((record) =>
          Object.entries(conditions).every(([key, value]) => record[key] === value)
        );

        return {
          first: jest.fn(async () => entries[0]),
          update: jest.fn(async (payload) => {
            if (!entries[0]) {
              return 0;
            }
            Object.assign(entries[0], payload);
            return 1;
          }),
        };
      }),
      insert: jest.fn(async (payload) => {
        const record = { id: idCounter++, ...payload };
        records.set(record.purchase_code, record);
        return [record.id];
      }),
    };
  });

  dbFn.__reset = () => {
    records.clear();
    idCounter = 1;
  };

  return dbFn;
});

jest.mock('axios');

const axios = require('axios');
const db = require('../../src/config/database');
const { validatePurchaseCode } = require('../../src/services/licenseService');

describe('licenseService.validatePurchaseCode', () => {
  beforeEach(() => {
    db.__reset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.ENVATO_TOKEN;
  });

  it('returns a license id when Envato validation persists the record', async () => {
    process.env.ENVATO_TOKEN = 'token';
    axios.get.mockResolvedValue({ data: { item: { name: 'Example' }, buyer_email: 'buyer@example.com' } });

    const result = await validatePurchaseCode('ENV-123', 'example.com');

    expect(result).toEqual({ valid: true, message: 'License verified with Envato', licenseId: 1 });
  });

  it('returns a license id when the demo code path persists the record', async () => {
    process.env.ENVATO_TOKEN = '';

    const result = await validatePurchaseCode('DEMO-CODE-1234', 'demo.example.com');

    expect(result).toEqual({ valid: true, message: 'Demo license accepted', licenseId: 1 });
  });

  it('returns null license id when persistence is skipped', async () => {
    process.env.ENVATO_TOKEN = 'token';
    axios.get.mockResolvedValue({ data: { item: { name: 'Example' }, buyer_email: 'buyer@example.com' } });

    const result = await validatePurchaseCode('ENV-123', '   ', { persist: false });

    expect(result).toEqual({ valid: true, message: 'License verified with Envato', licenseId: null });
    expect(db).not.toHaveBeenCalled();
  });
});

