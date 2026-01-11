const request = require("supertest");
const express = require("express");

const mockToken = "access-token";

jest.mock("../src/modules/auth/services/auth.service", () => ({
  generateAccessToken: jest.fn(() => mockToken),
}));

const mockUser = {
  id: "user-1",
  role: "student",
  roles: ["student"],
  platform_role: "none",
  memberships: [
    { tenant_id: "tenant-1", role: "student", status: "active" },
    { tenant_id: "tenant-2", role: "student", status: "active" },
  ],
};

jest.mock("../src/middleware/auth/authMiddleware", () => ({
  verifyToken: (req, _res, next) => {
    req.user = { ...mockUser };
    next();
  },
}));

const authRoutes = require("../src/modules/auth/routes/auth.routes");
const errorHandler = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(errorHandler);

let server;

describe("auth switch-tenant route", () => {
  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll(() => {
    if (server?.close) server.close();
  });

  test("switches tenant across active memberships", async () => {
    const res = await request(server)
      .post("/api/auth/switch-tenant")
      .send({ tenant_id: "tenant-2" });

    expect(res.status).toBe(200);
    expect(res.body.currentTenantId).toBe("tenant-2");
    expect(res.body.accessToken).toBe(mockToken);
  });

  test("rejects non-member tenant switches", async () => {
    const res = await request(server)
      .post("/api/auth/switch-tenant")
      .send({ tenant_id: "tenant-3" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Tenant membership not found");
  });

  test("rejects missing tenant_id", async () => {
    const res = await request(server).post("/api/auth/switch-tenant").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("tenant_id is required");
  });
});
