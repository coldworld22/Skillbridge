jest.mock("../src/modules/notifications/notifications.service", () => ({
  createNotification: jest.fn(),
}));

jest.mock("../src/modules/auth/utils/sanitizeUser", () => jest.fn((user) => user));

jest.mock("../src/modules/auth/services/auth.service", () => ({
  generateAccessToken: jest.fn(() => "access-token"),
  issueRefreshToken: jest.fn(() => "refresh-token"),
}));

jest.mock("../src/modules/users/user.model", () => ({
  findBySocialAccount: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  insertUser: jest.fn(),
  getUserRoles: jest.fn(),
  getUserPermissions: jest.fn(),
  addSocialAccount: jest.fn(),
  updateUser: jest.fn(),
}));

const membershipRows = [
  { tenant_id: "tenant-a", role: "student", status: "active" },
  { tenant_id: "tenant-b", role: "admin", status: "active" },
];

jest.mock("../src/config/database", () => {
  return jest.fn((table) => {
    if (table === "tenant_memberships") {
      return {
        select: jest.fn(() => ({
          where: jest.fn().mockResolvedValue(membershipRows),
        })),
      };
    }
    if (table === "users") {
      return {
        where: jest.fn(() => ({
          update: jest.fn(() => ({
            returning: jest.fn().mockResolvedValue([
              { id: "user-1", is_online: true, updated_at: new Date() },
            ]),
          })),
        })),
      };
    }
    return {};
  });
});

const socialAuthService = require("../src/modules/auth/services/socialAuth.service");
const notificationService = require("../src/modules/notifications/notifications.service");
const authService = require("../src/modules/auth/services/auth.service");
const userModel = require("../src/modules/users/user.model");

describe("social auth tenant id propagation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    userModel.findBySocialAccount.mockResolvedValue({ user_id: "user-1" });
    userModel.findById.mockResolvedValue({
      id: "user-1",
      role: "Student",
      status: "active",
      profile_complete: true,
      is_email_verified: true,
    });
    userModel.getUserRoles.mockResolvedValue(["Student"]);
    userModel.getUserPermissions.mockResolvedValue([]);
  });

  it("uses the requested tenant_id when issuing social tokens", async () => {
    const result = await socialAuthService.loginOrRegister({
      provider: "google",
      providerId: "google-id",
      email: "user@example.com",
      fullName: "User",
      tenant_id: "tenant-b",
    });

    expect(authService.generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        current_tenant_id: "tenant-b",
        memberships: membershipRows,
      }),
    );
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");
    expect(notificationService.createNotification).toHaveBeenCalled();
  });
});
