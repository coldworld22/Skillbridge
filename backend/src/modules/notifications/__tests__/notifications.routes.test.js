const request = require("supertest");
const express = require("express");

jest.mock("../notifications.service", () => ({
  createNotification: jest.fn(),
  getUserNotifications: jest.fn(),
  markAsRead: jest.fn(),
  deleteNotification: jest.fn(),
}));
const service = require("../notifications.service");

jest.mock("../../../middleware/auth/authMiddleware", () => {
  let currentUser = { id: "user-1", roles: ["student"] };
  return {
    verifyToken: (req, _res, next) => {
      req.user = currentUser;
      next();
    },
    __setCurrentUser: (user) => {
      currentUser = user;
    },
  };
});
const { __setCurrentUser } = require("../../../middleware/auth/authMiddleware");

const routes = require("../notifications.routes");
const controller = require("../notifications.controller");

describe("notifications routes", () => {
  const app = express();
  app.use(express.json());
  app.use("/notifications", routes);

  beforeEach(() => {
    jest.clearAllMocks();
    service.createNotification.mockResolvedValue({ id: "note-1" });
    __setCurrentUser({ id: "user-1", roles: ["student"] });
  });

  test("blocks non-admins from creating notifications for others", async () => {
    const res = await request(app).post("/notifications").send({
      user_id: "user-2",
      type: "info",
      message: "hi",
    });

    expect(res.status).toBe(403);
    expect(service.createNotification).not.toHaveBeenCalled();
  });

  test("allows a user to create a notification for themselves", async () => {
    const res = await request(app).post("/notifications").send({
      user_id: "user-1",
      type: "info",
      message: "hi",
    });

    expect(res.status).toBe(200);
    expect(service.createNotification).toHaveBeenCalledWith({
      user_id: "user-1",
      type: "info",
      message: "hi",
    });
  });

  test("allows admins to target other users", async () => {
    __setCurrentUser({ id: "admin", roles: ["admin"] });

    const res = await request(app).post("/notifications").send({
      user_id: "user-2",
      type: "info",
      message: "hi",
    });

    expect(res.status).toBe(200);
    expect(service.createNotification).toHaveBeenCalledWith({
      user_id: "user-2",
      type: "info",
      message: "hi",
    });
  });
});

describe("notifications controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    service.createNotification.mockResolvedValue({ id: "note-1" });
  });

  test("rejects non-admins targeting other users", async () => {
    const req = {
      body: { user_id: "other", type: "info", message: "hi" },
      user: { id: "self", roles: ["student"] },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    const err = next.mock.calls[0][0];
    expect(err.statusCode || err.status).toBe(403);
    expect(service.createNotification).not.toHaveBeenCalled();
  });

  test("allows admin to target others", async () => {
    const req = {
      body: { user_id: "other", type: "info", message: "hi" },
      user: { id: "admin", roles: ["admin"] },
    };
    const res = { status: jest.fn(() => res), json: jest.fn() };
    const next = jest.fn();

    await controller.create(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(service.createNotification).toHaveBeenCalledWith({
      user_id: "other",
      type: "info",
      message: "hi",
    });
  });
});

