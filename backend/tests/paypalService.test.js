const paymentMethodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const paypalService = require('../src/services/paypalService');

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getPayPalSettings: jest.fn(),
}));

const mockCreateOrder = jest.fn().mockResolvedValue({ result: { id: 'order123' } });
const mockCaptureOrder = jest.fn().mockResolvedValue({ result: { id: 'capture123' } });

jest.mock('@paypal/paypal-server-sdk', () => ({
  OrdersController: jest.fn().mockImplementation(() => ({
    createOrder: mockCreateOrder,
    captureOrder: mockCaptureOrder,
  })),
  Client: jest.fn(),
  Environment: { Sandbox: 'sandbox', Production: 'production' },
  CheckoutPaymentIntent: { Capture: 'CAPTURE' },
}));

const { Client, Environment, CheckoutPaymentIntent } = require('@paypal/paypal-server-sdk');

describe('paypalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    paypalService.invalidateClient();
    paymentMethodsService.getPayPalSettings.mockResolvedValue({
      client_id: 'id',
      client_secret: 'secret',
      mode: 'sandbox',
    });
  });

  it('creates an order', async () => {
    const result = await paypalService.createOrder({ amount: 10, currency: 'USD' });
    expect(result).toEqual({ id: 'order123' });
    expect(Client).toHaveBeenCalledWith({
      environment: Environment.Sandbox,
      clientCredentialsAuthCredentials: {
        oAuthClientId: 'id',
        oAuthClientSecret: 'secret',
      },
    });
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            { amount: { currencyCode: 'USD', value: '10.00' } },
          ],
        }),
        prefer: 'return=representation',
      })
    );
  });

  it('rounds the amount for two-decimal currencies', async () => {
    await paypalService.createOrder({ amount: 12.3456, currency: 'USD' });

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          purchaseUnits: [
            { amount: { currencyCode: 'USD', value: '12.35' } },
          ],
        }),
      })
    );
  });

  it('applies the correct precision for zero and three decimal currencies', async () => {
    await paypalService.createOrder({ amount: 99.6, currency: 'jpy' });
    await paypalService.createOrder({ amount: 7.9876, currency: 'KWD' });

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          purchaseUnits: [
            { amount: { currencyCode: 'JPY', value: '100' } },
          ],
        }),
      })
    );

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          purchaseUnits: [
            { amount: { currencyCode: 'KWD', value: '7.988' } },
          ],
        }),
      })
    );
  });

  it('includes return and cancel URLs when provided', async () => {
    await paypalService.createOrder({
      amount: 5,
      currency: 'USD',
      returnUrl: 'https://example.com/return',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          applicationContext: {
            returnUrl: 'https://example.com/return',
            cancelUrl: 'https://example.com/cancel',
          },
        }),
      })
    );
  });

  it('retries transient PayPal errors when creating an order', async () => {
    const transientError = Object.assign(new Error('Connection reset'), {
      code: 'ECONNRESET',
    });
    mockCreateOrder
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce({ result: { id: 'order123' } });

    const result = await paypalService.createOrder({ amount: 10, currency: 'USD' });

    expect(result).toEqual({ id: 'order123' });
    expect(mockCreateOrder).toHaveBeenCalledTimes(2);
    expect(Client).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-transient PayPal errors and surfaces details', async () => {
    const sdkError = Object.assign(new Error('Invalid request'), {
      statusCode: 400,
      result: {
        debug_id: 'XYZ123',
        details: [
          {
            issue: 'INVALID_REQUEST',
            description: 'Amount is invalid',
          },
        ],
      },
    });
    mockCreateOrder.mockRejectedValueOnce(sdkError);

    await expect(
      paypalService.createOrder({ amount: 10, currency: 'USD' })
    ).rejects.toMatchObject({
      message: 'PayPal rejected the request. Please try again or use a different payment method.',
      statusCode: 400,
      details: {
        status: 400,
        debugId: 'XYZ123',
        issues: ['INVALID_REQUEST'],
        descriptions: ['Amount is invalid'],
      },
    });

    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
  });

  it('surfaces contextual details for transient PayPal connectivity errors', async () => {
    const networkError = Object.assign(new Error('getaddrinfo ENOTFOUND api.paypal.com'), {
      code: 'ENOTFOUND',
    });
    mockCreateOrder.mockRejectedValue(networkError);

    await expect(
      paypalService.createOrder({ amount: 10, currency: 'USD' })
    ).rejects.toMatchObject({
      message:
        'Unable to reach PayPal right now (ENOTFOUND). Please verify outgoing network connectivity and try again.',
      statusCode: 502,
      details: {
        code: 'ENOTFOUND',
        retryable: true,
      },
    });

    expect(mockCreateOrder).toHaveBeenCalledTimes(3);
  });

  it('captures an order', async () => {
    const capture = await paypalService.captureOrder('order123');
    expect(capture).toEqual({ id: 'capture123' });
    expect(mockCaptureOrder).toHaveBeenCalledWith({ id: 'order123', body: {} });
  });

  it('retries transient PayPal errors when capturing an order', async () => {
    const timeoutError = Object.assign(new Error('Request timeout'), {
      name: 'TimeoutError',
    });
    mockCaptureOrder
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValueOnce({ result: { id: 'capture123' } });

    const capture = await paypalService.captureOrder('order123');

    expect(capture).toEqual({ id: 'capture123' });
    expect(mockCaptureOrder).toHaveBeenCalledTimes(2);
  });
});
