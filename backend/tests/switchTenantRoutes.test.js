const request = require("supertest");
const express = require("express");
const errorHandler = require("../src/middleware/errorHandler");

jest.mock("../src/middleware/auth/authMiddleware", () => ({
  verifyToken: (req, _res, next) => {
    req.user = {
      id: "user-1",
      role: "Student",
      roles: ["Student"],
      memberships: [
        { tenant_id: "tenant-1", role: "student", status: "active" },
        { tenant_id: "tenant-2", role: "admin", status: "active" },
      ],
    };
    next();
  },
}));

jest.mock("../src/modules/auth/services/auth.service", () => ({
  generateAccessToken: jest.fn(() => "token-123"),
}));

const authRoutes = require("../src/modules/auth/routes/auth.routes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(errorHandler);

describe("switch tenant", () => {
  it("issues a new access token for the requested tenant", async () => {
    const res = await request(app)
      .post("/api/auth/switch-tenant")
      .send({ tenant_id: "tenant-2" });

    expect(res.status).toBe(200);
    expect(res.body.currentTenantId).toBe("tenant-2");
    expect(res.body.accessToken).toBe("token-123");
    expect(res.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringContaining("token=token-123")]),
    );
  });

  it("rejects switching to a tenant without membership", async () => {
    const res = await request(app)
      .post("/api/auth/switch-tenant")
      .send({ tenant_id: "tenant-9" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Tenant membership not found");
  });

  it("requires a tenant id", async () => {
    const res = await request(app).post("/api/auth/switch-tenant").send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("tenant_id is required");
  });
});
