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

  describe('activateLicense', () => {
    const body = {
      purchase_code: 'CODE-123',
      domain: 'example.com',
      email: 'owner@example.com',
      ip: '127.0.0.1',
    };

    it('activates a license when validation succeeds', async () => {
      validatePurchaseCode.mockResolvedValue({ valid: true, message: 'ok', licenseId: 7 });
      service.activate.mockResolvedValue({ id: 7, purchase_code: body.purchase_code });

      const req = httpMocks.createRequest({ method: 'POST', body });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await controller.activateLicense(req, res, next);

      expect(validatePurchaseCode).toHaveBeenCalledWith(body.purchase_code, body.domain);
      expect(service.activate).toHaveBeenCalledWith(body);
      expect(service.logAction).toHaveBeenNthCalledWith(1, 7, 'verify', {
        status: 'success',
        domain: body.domain,
        ip: body.ip,
      });
      expect(service.logAction).toHaveBeenNthCalledWith(2, 7, 'activate', {
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

  describe('verifyPurchaseCode', () => {
    it('logs a verify action when validation succeeds', async () => {
      validatePurchaseCode.mockResolvedValue({
        valid: true,
        message: 'ok',
        licenseId: 11,
      });

      const req = httpMocks.createRequest({
        method: 'POST',
        body: { purchase_code: 'CODE-123', domain: 'example.com' },
        connection: { remoteAddress: '127.0.0.1' },
      });
      req.ip = '127.0.0.1';
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await controller.verifyPurchaseCode(req, res, next);

      expect(service.logAction).toHaveBeenCalledWith(11, 'verify', {
        status: 'success',
        domain: 'example.com',
        ip: '127.0.0.1',
      });
      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ success: true, message: 'ok' });
      expect(next).not.toHaveBeenCalled();
    });

    it('does not log when validation fails', async () => {
      validatePurchaseCode.mockResolvedValue({ valid: false, message: 'nope' });

      const req = httpMocks.createRequest({
        method: 'POST',
        body: { purchase_code: 'CODE-123', domain: 'example.com' },
      });
      const res = httpMocks.createResponse();
      const next = jest.fn();

      await controller.verifyPurchaseCode(req, res, next);

      expect(service.logAction).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res._getJSONData()).toEqual({ success: false, message: 'nope' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

