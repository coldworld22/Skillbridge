const request = require("supertest");
const express = require("express");
const { newDb } = require("pg-mem");
const { v4: uuidv4 } = require("uuid");

const db = newDb();
db.public.registerFunction({
  name: "uuid_generate_v4",
  returns: "uuid",
  implementation: uuidv4,
});
const mockDb = db.adapters.createKnex();
const mockTenantId = uuidv4();
const mockUserId = uuidv4();

jest.mock("../src/config/database", () => mockDb);

jest.mock("../src/services/mailService", () => ({
  sendMail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/middleware/auth/authMiddleware", () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: mockUserId, full_name: "Test User" };
    next();
  },
}));

jest.mock("../src/middleware/tenant", () => ({
  resolveTenant: (req, _res, next) => {
    req.tenant = { id: mockTenantId, slug: "test" };
    next();
  },
  ensureTenantMembership: () => (_req, _res, next) => next(),
  enforceTenantStatus: () => (_req, _res, next) => next(),
  requireEntitlement: () => (_req, _res, next) => next(),
}));

const routes = require("../src/modules/auth/routes/tenantInvite.routes");
const errorHandler = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/tenant-invites", routes);
app.use(errorHandler);

let server;

describe("tenant invite routes", () => {
  beforeAll(async () => {
    await mockDb.schema.createTable("users", (table) => {
      table.uuid("id").primary();
      table.text("full_name");
      table.text("email").notNullable();
      table.text("role").notNullable();
      table.text("status").notNullable();
      table.boolean("is_email_verified").notNullable();
      table.boolean("profile_complete").notNullable();
      table.timestamp("created_at");
      table.timestamp("updated_at");
    });

    await mockDb.schema.createTable("tenant_memberships", (table) => {
      table.uuid("id").primary();
      table.uuid("tenant_id").notNullable();
      table.uuid("user_id").notNullable();
      table.text("role").notNullable();
      table.text("status").notNullable();
      table.uuid("invited_by");
      table.timestamp("created_at");
      table.timestamp("updated_at");
      table.unique(["tenant_id", "user_id"]);
    });

    server = app.listen(0);
  });

  afterAll(async () => {
    if (server?.close) server.close();
    await mockDb.destroy();
  });

  beforeEach(async () => {
    await mockDb("tenant_memberships").del();
    await mockDb("users").del();
  });

  test("creates an invite for a new user", async () => {
    const res = await request(server)
      .post("/api/tenant-invites")
      .send({ email: "new-user@example.com", role: "student" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Invite sent");
    expect(res.body.data.tenant_id).toBe(mockTenantId);
    expect(res.body.data.status).toBe("pending");

    const createdUser = await mockDb("users")
      .where({ email: "new-user@example.com" })
      .first();
    expect(createdUser).toBeTruthy();

    const membership = await mockDb("tenant_memberships")
      .where({ tenant_id: mockTenantId, user_id: createdUser.id })
      .first();
    expect(membership).toBeTruthy();
  });

  test("returns existing membership when already invited", async () => {
    const [user] = await mockDb("users")
      .insert({
        id: mockUserId,
        full_name: "Existing User",
        email: "existing@example.com",
        role: "student",
        status: "pending",
        is_email_verified: false,
        profile_complete: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    const [membership] = await mockDb("tenant_memberships")
      .insert({
        id: uuidv4(),
        tenant_id: mockTenantId,
        user_id: user.id,
        role: "student",
        status: "pending",
        invited_by: mockUserId,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    const res = await request(server)
      .post("/api/tenant-invites")
      .send({ email: "existing@example.com", role: "student" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User already invited");
    expect(res.body.data.id).toBe(membership.id);
  });

  test("accepts an invite and activates membership", async () => {
    const [user] = await mockDb("users")
      .insert({
        id: mockUserId,
        full_name: "Invitee",
        email: "invitee@example.com",
        role: "student",
        status: "pending",
        is_email_verified: false,
        profile_complete: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    await mockDb("tenant_memberships").insert({
      id: uuidv4(),
      tenant_id: mockTenantId,
      user_id: user.id,
      role: "student",
      status: "pending",
      invited_by: mockUserId,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await request(server)
      .post("/api/tenant-invites/accept")
      .send({ tenant_id: mockTenantId });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("active");

    const updated = await mockDb("tenant_memberships")
      .where({ tenant_id: mockTenantId, user_id: user.id })
      .first();
    expect(updated.status).toBe("active");
  });

  test("rejects expired invites", async () => {
    const [user] = await mockDb("users")
      .insert({
        id: mockUserId,
        full_name: "Expired",
        email: "expired@example.com",
        role: "student",
        status: "pending",
        is_email_verified: false,
        profile_complete: false,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    const expiredDate = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);

    await mockDb("tenant_memberships").insert({
      id: uuidv4(),
      tenant_id: mockTenantId,
      user_id: user.id,
      role: "student",
      status: "pending",
      invited_by: mockUserId,
      created_at: expiredDate,
      updated_at: expiredDate,
    });

    const res = await request(server)
      .post("/api/tenant-invites/accept")
      .send({ tenant_id: mockTenantId });

    expect(res.status).toBe(410);
    expect(res.body.message).toBe("Invite expired");
  });
});
