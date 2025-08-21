const { hasPermission } = require('../src/middleware/auth/authMiddleware');

describe('hasPermission middleware', () => {
  it('calls next when permission exists', () => {
    const req = { user: { permissions: ['manage_roles'] } };
    const res = {};
    const next = jest.fn();
    hasPermission('manage_roles')(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('sends 403 when permission missing', () => {
    const req = { user: { permissions: ['other'] } };
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const res = { status, json };
    const next = jest.fn();
    hasPermission('manage_roles')(req, res, next);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
