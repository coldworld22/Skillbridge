const httpMocks = require('node-mocks-http');

jest.mock('../src/modules/license/license.service', () => ({
  activate: jest.fn(),
  logAction: jest.fn(),
  findByCode: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../src/services/licenseService', () => ({
  validatePurchaseCode: jest.fn(),
}));

const service = require('../src/modules/license/license.service');
const { validatePurchaseCode } = require('../src/services/licenseService');
const controller = require('../src/modules/license/license.controller');

describe('license.controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyPurchaseCode', () => {
    const body = { purchase_code: 'CODE-123', domain: 'example.com' };

    it('logs verification when purchase code validation succeeds', async () => {
      validatePurchaseCode.mockResolvedValue({ valid: true, message: 'ok' });
      service.findByCode.mockResolvedValue({ id: 12, domain: 'stored.com' });

      const req = httpMocks.createRequest({ method: 'POST', body });
      req.ip = '203.0.113.5';
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await controller.verifyPurchaseCode(req, res, next);

      expect(validatePurchaseCode).toHaveBeenCalledWith(body.purchase_code, body.domain);
      expect(service.findByCode).toHaveBeenCalledWith(body.purchase_code);
      expect(service.logAction).toHaveBeenCalledWith(12, 'verify', {
        ip: '203.0.113.5',
        domain: body.domain,
        status: 'success',
      });
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ success: true, message: 'ok' });
      expect(next).not.toHaveBeenCalled();
    });

    it('falls back to stored domain when none provided', async () => {
      validatePurchaseCode.mockResolvedValue({ valid: true, message: 'stored domain ok' });
      service.findByCode.mockResolvedValue({ id: 34, domain: 'stored.com' });

      const req = httpMocks.createRequest({
        method: 'POST',
        body: { purchase_code: 'CODE-456' },
      });
      req.ip = '198.51.100.10';
      const res = httpMocks.createResponse();

      await controller.verifyPurchaseCode(req, res, jest.fn());

      expect(validatePurchaseCode).toHaveBeenCalledWith('CODE-456', undefined);
      expect(service.findByCode).toHaveBeenCalledWith('CODE-456');
      expect(service.logAction).toHaveBeenCalledWith(34, 'verify', {
        ip: '198.51.100.10',
        domain: 'stored.com',
        status: 'success',
      });
      expect(res.statusCode).toBe(200);
    });

    it('does not log when validation fails', async () => {
      validatePurchaseCode.mockResolvedValue({ valid: false, message: 'Invalid purchase code' });

      const req = httpMocks.createRequest({ method: 'POST', body });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await controller.verifyPurchaseCode(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({ success: false, message: 'Invalid purchase code' });
      expect(service.findByCode).not.toHaveBeenCalled();
      expect(service.logAction).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('activateLicense', () => {
    const body = {
      purchase_code: 'CODE-123',
      domain: 'example.com',
      email: 'owner@example.com',
      ip: '127.0.0.1',
    };

    it('activates a license when validation succeeds', async () => {
      validatePurchaseCode.mockResolvedValue({ valid: true, message: 'ok' });
      service.activate.mockResolvedValue({ id: 7, purchase_code: body.purchase_code });

      const req = httpMocks.createRequest({ method: 'POST', body });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await controller.activateLicense(req, res, next);

      expect(validatePurchaseCode).toHaveBeenCalledWith(body.purchase_code, body.domain);
      expect(service.activate).toHaveBeenCalledWith(body);
      expect(service.logAction).toHaveBeenCalledWith(7, 'activate', {
        ip: body.ip,
        domain: body.domain,
        status: 'success',
      });
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({
        success: true,
        data: { id: 7, purchase_code: body.purchase_code },
        message: 'ok',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 400 when purchase code validation fails', async () => {
      validatePurchaseCode.mockResolvedValue({ valid: false, message: 'Invalid purchase code' });

      const req = httpMocks.createRequest({ method: 'POST', body });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await controller.activateLicense(req, res, next);

      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({ success: false, message: 'Invalid purchase code' });
      expect(service.activate).not.toHaveBeenCalled();
      expect(service.logAction).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('deactivateLicense', () => {
    it('logs deactivation using provided domain when available', async () => {
      const req = httpMocks.createRequest({
        method: 'POST',
        body: { purchase_code: 'CODE-123', domain: 'another.com' },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      service.findByCode.mockResolvedValue({ id: 3, domain: 'stored.com' });

      await controller.deactivateLicense(req, res, next);

      expect(service.update).toHaveBeenCalledWith(3, { status: 'inactive' });
      expect(service.logAction).toHaveBeenCalledWith(3, 'deactivate', {
        status: 'success',
        domain: 'another.com',
      });
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ success: true });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

