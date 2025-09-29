const httpMocks = require('node-mocks-http');

jest.mock('../../../src/modules/license/license.service', () => ({
  activate: jest.fn(),
  logAction: jest.fn(),
}));

jest.mock('../../../src/services/licenseService', () => ({
  validatePurchaseCode: jest.fn(),
}));

const service = require('../../../src/modules/license/license.service');
const { validatePurchaseCode } = require('../../../src/services/licenseService');
const controller = require('../../../src/modules/license/license.controller');

describe('modules/license activateLicense controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalises domain before activating license', async () => {
    validatePurchaseCode.mockResolvedValue({ valid: true, message: 'ok' });
    service.activate.mockResolvedValue({ id: 1, domain: 'example.com' });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        purchase_code: 'CODE-123',
        domain: ' Example.COM ',
        email: 'owner@example.com',
        ip: '127.0.0.1',
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await controller.activateLicense(req, res, next);

    expect(validatePurchaseCode).toHaveBeenCalledWith('CODE-123', ' Example.COM ', { persist: true });
    expect(service.activate).toHaveBeenCalledWith({
      purchase_code: 'CODE-123',
      domain: 'example.com',
      email: 'owner@example.com',
      ip: '127.0.0.1',
    });
    expect(service.logAction).toHaveBeenCalledWith(1, 'activate', {
      ip: '127.0.0.1',
      domain: 'example.com',
      status: 'success',
    });
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      data: { id: 1, domain: 'example.com' },
      message: 'ok',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('falls back to license domain when none supplied', async () => {
    validatePurchaseCode.mockResolvedValue({ valid: true, message: 'ok' });
    service.activate.mockResolvedValue({ id: 2, domain: 'stored-domain.com' });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        purchase_code: 'CODE-456',
        email: 'owner@example.com',
        ip: '10.0.0.1',
      },
    });
    const res = httpMocks.createResponse();
    const next = jest.fn();

    await controller.activateLicense(req, res, next);

    expect(validatePurchaseCode).toHaveBeenCalledWith('CODE-456', undefined, { persist: true });
    expect(service.activate).toHaveBeenCalledWith({
      purchase_code: 'CODE-456',
      domain: undefined,
      email: 'owner@example.com',
      ip: '10.0.0.1',
    });
    expect(service.logAction).toHaveBeenCalledWith(2, 'activate', {
      ip: '10.0.0.1',
      domain: 'stored-domain.com',
      status: 'success',
    });
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({
      success: true,
      data: { id: 2, domain: 'stored-domain.com' },
      message: 'ok',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
