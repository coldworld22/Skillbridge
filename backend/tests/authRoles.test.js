const { isAdmin } = require("../src/middleware/auth/authMiddleware");

describe("auth middleware role handling", () => {
  const resFactory = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it("denies access gracefully when roles array contains null", () => {
    const req = { user: { roles: [null] } };
    const res = resFactory();
    const next = jest.fn();
    isAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows access when admin role present alongside null", () => {
    const req = { user: { roles: [null, "Admin"] } };
    const res = resFactory();
    const next = jest.fn();
    isAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
