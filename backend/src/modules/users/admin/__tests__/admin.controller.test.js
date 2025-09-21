jest.mock("../../../../config/database", () => jest.fn());

const db = require("../../../../config/database");
const { getProfile } = require("../admin.controller");

describe("admin controller - getProfile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createQueryBuilder = (rows) => {
    return {
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue(rows),
    };
  };

  it("returns defaults when admin profile is missing", async () => {
    const userRow = {
      id: "user-123",
      full_name: "Admin User",
      email: "admin@example.com",
      phone: "1234567890",
      gender: "other",
      date_of_birth: "1990-01-01",
      avatar_url: "https://example.com/avatar.png",
      is_email_verified: true,
      is_phone_verified: false,
      profile_complete: false,
      created_at: "2024-01-01T00:00:00.000Z",
      updated_at: "2024-01-02T00:00:00.000Z",
    };

    db.mockImplementation((table) => {
      if (table === "users") {
        return createQueryBuilder([userRow]);
      }

      if (table === "admin_profiles") {
        return createQueryBuilder([]);
      }

      if (table === "user_social_links") {
        return createQueryBuilder([]);
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const req = { user: { id: userRow.id } };
    const res = { json: jest.fn() };

    await getProfile(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: userRow.id,
        full_name: userRow.full_name,
        job_title: null,
        department: null,
        identity_doc_url: null,
        admin_profile_created_at: null,
        admin_profile_updated_at: null,
        social_links: [],
      })
    );
  });
});
