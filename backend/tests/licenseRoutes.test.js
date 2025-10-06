jest.mock('../src/modules/license/license.service', () => ({
  logAction: jest.fn(),
  activate: jest.fn(),
  findByCode: jest.fn(),
  update: jest.fn(),
  listLogs: jest.fn(),
  getStatus: jest.fn(),
  markSuspicious: jest.fn(),
}));

jest.mock('../src/services/licenseService', () => ({
  validatePurchaseCode: jest.fn(),
}));

jest.mock('../src/middleware/auth/authMiddleware', () => ({
  verifyToken: jest.fn(() => (req, res, next) => next()),
  isAdmin: jest.fn(() => (req, res, next) => next()),
}));

const controller = require('../src/modules/license/license.controller');
const licenseRoutes = require('../src/modules/license/license.routes');

const findRoute = (path, method) =>
  licenseRoutes.stack.find(
    (layer) => layer.route && layer.route.path === path && layer.route.methods[method]
  );

describe('license.routes', () => {
  it('registers POST /verify with the license controller', () => {
    const layer = findRoute('/verify', 'post');
    expect(layer).toBeDefined();

    const handlers = layer.route.stack.map((stack) => stack.handle);
    expect(handlers[handlers.length - 1]).toBe(controller.verifyPurchaseCode);
  });
});
