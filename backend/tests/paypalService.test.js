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
            { amount: { currencyCode: 'USD', value: '10' } },
          ],
        }),
        prefer: 'return=representation',
      })
    );
  });

  it('captures an order', async () => {
    const capture = await paypalService.captureOrder('order123');
    expect(capture).toEqual({ id: 'capture123' });
    expect(mockCaptureOrder).toHaveBeenCalledWith({ id: 'order123', body: {} });
  });
});
