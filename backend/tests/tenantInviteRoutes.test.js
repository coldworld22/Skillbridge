const request = require("supertest");
const express = require("express");
const errorHandler = require("../src/middleware/errorHandler");

const mockMembershipRecords = [];

const mockMembershipTable = {
  where: jest.fn((criteria) => {
    return {
      first: jest.fn(async () =>
        mockMembershipRecords.find((record) =>
          Object.entries(criteria).every(([key, value]) => record[key] === value),
        ),
      ),
      update: jest.fn((updates) => ({
        returning: jest.fn(async () => {
          const match = mockMembershipRecords.find(
            (record) => record.id === criteria.id,
          );
          if (match) {
            Object.assign(match, updates);
            return [match];
          }
          return [];
        }),
      })),
    };
  }),
  insert: jest.fn((payload) => ({
    returning: jest.fn(async () => {
      const record = { ...payload };
      mockMembershipRecords.push(record);
      return [record];
    }),
  })),
};

jest.mock("../src/config/database", () => {
  return jest.fn((table) => {
    if (table === "tenant_memberships") {
      return mockMembershipTable;
    }
    return {};
  });
});

jest.mock("../src/middleware/auth/authMiddleware", () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: "user-1" };
    next();
  },
}));

jest.mock("../src/middleware/tenant", () => ({
  resolveTenant: (req, _res, next) => {
    req.tenant = { id: "tenant-1", slug: "acme" };
    next();
  },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

jest.mock("../src/services/mailService", () => ({
  sendMail: jest.fn(),
}));

jest.mock("../src/modules/users/user.model", () => ({
  findByEmail: jest.fn(),
  insertUser: jest.fn(),
}));

const { sendMail } = require("../src/services/mailService");
const userModel = require("../src/modules/users/user.model");
const tenantInviteRoutes = require("../src/modules/auth/routes/tenantInvite.routes");

const app = express();
app.use(express.json());
app.use("/api/auth/tenant-invites", tenantInviteRoutes);
app.use(errorHandler);

beforeEach(() => {
  mockMembershipRecords.splice(0, mockMembershipRecords.length);
  mockMembershipTable.where.mockClear();
  mockMembershipTable.insert.mockClear();
  sendMail.mockClear();
  userModel.findByEmail.mockReset();
  userModel.insertUser.mockReset();
});

describe("tenant invite routes", () => {
  it("creates a membership and sends an invite", async () => {
    userModel.findByEmail.mockResolvedValueOnce(null);
    userModel.insertUser.mockResolvedValueOnce([
      { id: "user-2", email: "new@user.com" },
    ]);

    const res = await request(app)
      .post("/api/auth/tenant-invites")
      .send({ email: "new@user.com", role: "student" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Invite sent");
    expect(mockMembershipRecords).toHaveLength(1);
    expect(mockMembershipRecords[0]).toEqual(
      expect.objectContaining({
        tenant_id: "tenant-1",
        user_id: "user-2",
        status: "pending",
        invited_by: "user-1",
      }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new@user.com",
        subject: "You have been invited",
      }),
    );
  });

  it("returns early when the membership already exists", async () => {
    mockMembershipRecords.push({
      id: "membership-1",
      tenant_id: "tenant-1",
      user_id: "user-3",
      status: "pending",
    });
    userModel.findByEmail.mockResolvedValueOnce({ id: "user-3" });

    const res = await request(app)
      .post("/api/auth/tenant-invites")
      .send({ email: "existing@user.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User already invited");
    expect(mockMembershipTable.insert).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("activates a pending invite", async () => {
    mockMembershipRecords.push({
      id: "membership-2",
      tenant_id: "tenant-1",
      user_id: "user-1",
      status: "pending",
    });

    const res = await request(app)
      .post("/api/auth/tenant-invites/accept")
      .send({ tenant_id: "tenant-1" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Membership activated");
    expect(mockMembershipRecords[0].status).toBe("active");
  });
});
