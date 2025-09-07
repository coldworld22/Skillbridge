const request = require('supertest');
const express = require('express');

jest.mock('../src/modules/payments/payments.service', () => ({
  getById: jest.fn(),
  update: jest.fn(),
  STATUS: { PAID: 'paid', REJECTED: 'rejected' },
}));

jest.mock('../src/modules/paymentMethods/paymentMethods.service', () => ({
  getById: jest.fn(),
}));

jest.mock('../src/services/coinbaseService', () => ({
  verifyWebhook: jest.fn(),
}));

jest.mock('../src/modules/payments/paymentAccess', () => ({
  grantAccess: jest.fn(),
}));

const paymentsService = require('../src/modules/payments/payments.service');
const methodsService = require('../src/modules/paymentMethods/paymentMethods.service');
const coinbaseService = require('../src/services/coinbaseService');
const { grantAccess } = require('../src/modules/payments/paymentAccess');
const routes = require('../src/modules/payments/coinbase.routes');
const { STATUS } = require('../src/modules/payments/payments.service');

const app = express();
app.use(express.json());
app.use('/api/payments/coinbase', routes);
const errorHandler = require('../src/middleware/errorHandler');
app.use(errorHandler);

describe('POST /api/payments/coinbase/webhook', () => {
  it('marks payment as paid when charge confirmed', async () => {
    const payload = {
      event: {
        type: 'charge:confirmed',
        data: { id: 'ch_1', metadata: { payment_id: 'p1' } },
      },
    };
    coinbaseService.verifyWebhook.mockReturnValue(true);
    paymentsService.getById.mockResolvedValue({ id: 'p1', method_id: 'm1' });
    methodsService.getById.mockResolvedValue({ id: 'm1', settings: { webhook_secret: 'whsec' } });
    paymentsService.update.mockResolvedValue({ id: 'p1', status: STATUS.PAID });

    const res = await request(app)
      .post('/api/payments/coinbase/webhook')
      .set('X-CC-Webhook-Signature', 'sig')
      .send(payload);

    expect(res.status).toBe(200);
    expect(paymentsService.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ status: STATUS.PAID, reference_id: 'ch_1' })
    );
    expect(grantAccess).toHaveBeenCalled();
  });

  it('marks payment as rejected when charge failed', async () => {
    const payload = {
      event: {
        type: 'charge:failed',
        data: { id: 'ch_2', metadata: { payment_id: 'p2' } },
      },
    };
    coinbaseService.verifyWebhook.mockReturnValue(true);
    paymentsService.getById.mockResolvedValue({ id: 'p2', method_id: 'm1' });
    methodsService.getById.mockResolvedValue({ id: 'm1', settings: { webhook_secret: 'whsec' } });
    paymentsService.update.mockResolvedValue({ id: 'p2', status: STATUS.REJECTED });

    const res = await request(app)
      .post('/api/payments/coinbase/webhook')
      .set('X-CC-Webhook-Signature', 'sig')
      .send(payload);

    expect(res.status).toBe(200);
    expect(paymentsService.update).toHaveBeenCalledWith(
      'p2',
      expect.objectContaining({ status: STATUS.REJECTED, reference_id: 'ch_2' })
    );
  });
});

