const mockResponse = ({ ok = true, status = 200, body = '{}' }) => ({
  ok,
  status,
  text: jest.fn().mockResolvedValue(body),
});

describe('coinbaseService.createCharge', () => {
  const apiKey = 'test-key';
  const payload = { name: 'Test Charge', pricing_type: 'fixed_price' };
  let coinbaseService;

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
    coinbaseService = require('../src/services/coinbaseService');
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('falls back to checkout creation when Coinbase disables charges', async () => {
    const deprecatedBody = JSON.stringify({
      error: {
        type: 'forbidden_error',
        message: 'Charge creation has been deprecated',
      },
    });
    const checkoutBody = JSON.stringify({
      data: { id: 'checkout_123', hosted_url: 'https://commerce.coinbase.com/checkout/checkout_123' },
    });
    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: false, status: 403, body: deprecatedBody })
    );
    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: true, status: 200, body: checkoutBody })
    );

    const result = await coinbaseService.createCharge(apiKey, payload);

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.commerce.coinbase.com/charges',
      expect.objectContaining({ method: 'POST' })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.commerce.coinbase.com/checkouts',
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual(JSON.parse(checkoutBody));
  });

  it('surfaces other Coinbase API errors without masking them', async () => {
    const errorBody = JSON.stringify({
      error: { type: 'authentication_error', message: 'invalid api key' },
    });
    global.fetch.mockResolvedValueOnce(
      mockResponse({ ok: false, status: 401, body: errorBody })
    );

    await expect(coinbaseService.createCharge(apiKey, payload)).rejects.toThrow(
      /invalid api key/i
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
