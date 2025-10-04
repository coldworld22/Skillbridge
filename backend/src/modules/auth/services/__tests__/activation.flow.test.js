process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret";

jest.mock("../../../../config/database", () => {
  const { newDb } = require("pg-mem");
  const db = newDb({ autoCreateForeignKeyIndices: true });
  const knex = db.adapters.createKnex();
  knex.connectWithRetry = async () => {};
  return knex;
});

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

jest.mock("../../../../utils/email", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(),
  sendPasswordChangeEmail: jest.fn().mockResolvedValue(),
  sendWelcomeEmail: jest.fn().mockResolvedValue(),
  sendNewUserAdminEmail: jest.fn().mockResolvedValue(),
}));

jest.mock("../../../../services/smsService", () => ({
  sendSMS: jest.fn().mockResolvedValue(),
}));

const db = require("../../../../config/database");
const authService = require("../auth.service");
const verifyService = require("../../../verify/verify.service");
const userModel = require("../../../users/user.model");

jest.spyOn(verifyService, "sendOtp").mockResolvedValue({ alreadyVerified: false });

const originalInsertUser = userModel.insertUser;
jest.spyOn(userModel, "insertUser").mockImplementation((data, trx = db) => {
  const payload = { ...data };
  if (!payload.id) {
    payload.id = uuidv4();
  }
  return originalInsertUser.call(userModel, payload, trx);
});

async function resetTables() {
  await db("refresh_tokens").del();
  await db("verifications").del();
  await db("messages").del();
  await db("notifications").del();
  await db("user_roles").del();
  await db("users").del();
  await db("permissions").del();
  await db("role_permissions").del();
  await db("roles").del();
}

describe("Auth activation flow", () => {
  beforeAll(async () => {
    await db.schema.createTable("users", (table) => {
      table.string("id").primary();
      table.string("full_name").notNullable();
      table.string("email").notNullable().unique();
      table.string("phone").unique();
      table.string("password_hash").notNullable();
      table.string("role").notNullable();
      table.string("avatar_url");
      table.boolean("is_online").defaultTo(false);
      table.string("status").defaultTo("pending");
      table.boolean("profile_complete").defaultTo(false);
      table.boolean("is_email_verified").defaultTo(false);
      table.boolean("is_phone_verified").defaultTo(false);
      table.string("gender");
      table.timestamp("created_at").defaultTo(db.fn.now());
      table.timestamp("updated_at").defaultTo(db.fn.now());
    });

    await db.schema.createTable("verifications", (table) => {
      table.string("id").primary();
      table.string("user_id").notNullable();
      table.string("type").notNullable();
      table.string("code").notNullable();
      table.boolean("verified").defaultTo(false);
      table.timestamp("expires_at").notNullable();
      table.timestamp("created_at").defaultTo(db.fn.now());
    });

    await db.schema.createTable("roles", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
    });

    await db.schema.createTable("user_roles", (table) => {
      table.string("user_id").notNullable();
      table.integer("role_id").notNullable();
    });

    await db.schema.createTable("permissions", (table) => {
      table.increments("id").primary();
      table.string("code").notNullable();
    });

    await db.schema.createTable("role_permissions", (table) => {
      table.integer("role_id").notNullable();
      table.integer("permission_id").notNullable();
    });

    await db.schema.createTable("notifications", (table) => {
      table.increments("id").primary();
      table.string("user_id").notNullable();
      table.string("type");
      table.text("message");
      table.boolean("read").defaultTo(false);
      table.timestamp("read_at");
      table.timestamp("created_at").defaultTo(db.fn.now());
    });

    await db.schema.createTable("messages", (table) => {
      table.increments("id").primary();
      table.string("sender_id");
      table.string("receiver_id");
      table.text("message");
      table.string("booking_id");
      table.string("type");
      table.boolean("read").defaultTo(false);
      table.timestamp("read_at");
      table.timestamp("sent_at").defaultTo(db.fn.now());
    });

    await db.schema.createTable("refresh_tokens", (table) => {
      table.string("id").primary();
      table.string("user_id").notNullable();
      table.string("token_hash").notNullable();
      table.timestamp("expires_at").notNullable();
      table.timestamp("created_at").defaultTo(db.fn.now());
      table.timestamp("revoked_at");
    });
  });

  beforeEach(async () => {
    await resetTables();
    await db("roles").insert({ id: 1, name: "Student" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await db.schema.dropTableIfExists("messages");
    await db.schema.dropTableIfExists("notifications");
    await db.schema.dropTableIfExists("refresh_tokens");
    await db.schema.dropTableIfExists("role_permissions");
    await db.schema.dropTableIfExists("permissions");
    await db.schema.dropTableIfExists("user_roles");
    await db.schema.dropTableIfExists("verifications");
    await db.schema.dropTableIfExists("users");
    await db.schema.dropTableIfExists("roles");
    await db.destroy();
  });

  it("allows login immediately after email verification", async () => {
    const registration = await authService.registerUser({
      full_name: "Test User",
      email: "test.user@example.com",
      phone: "+10000000000",
      password: "StrongPass123!",
      role: "Student",
    });

    const userRecord = await db("users")
      .where({ email: registration.user.email })
      .first();

    expect(userRecord.status).toBe("pending");
    expect(Boolean(userRecord.is_email_verified)).toBe(false);

    await expect(
      authService.loginUser({
        email: registration.user.email,
        password: "StrongPass123!",
        ip: "127.0.0.1",
      }),
    ).rejects.toMatchObject({ statusCode: 403 });

    const otpCode = "123456";
    const codeHash = await bcrypt.hash(otpCode, 12);
    const now = new Date();
    await db("verifications").insert({
      id: uuidv4(),
      user_id: userRecord.id,
      type: "email",
      code: codeHash,
      expires_at: new Date(now.getTime() + 10 * 60 * 1000),
      verified: false,
      created_at: now,
    });

    await verifyService.verifyOtp(userRecord.id, "email", otpCode);

    const activatedUser = await db("users")
      .where({ id: userRecord.id })
      .first();

    expect(activatedUser.status).toBe("active");
    expect(Boolean(activatedUser.is_email_verified)).toBe(true);

    const loginResponse = await authService.loginUser({
      email: registration.user.email,
      password: "StrongPass123!",
      ip: "127.0.0.1",
    });

    expect(loginResponse.user.status).toBe("active");
    expect(Boolean(loginResponse.user.is_email_verified)).toBe(true);
    expect(loginResponse.accessToken).toBeDefined();
    expect(loginResponse.refreshToken).toBeDefined();
  });
});
