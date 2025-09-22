const AppError = require("../../../utils/AppError");

jest.mock("../notifications.service", () => ({
  createNotification: jest.fn().mockResolvedValue({ id: 123 }),
}));

const controller = require("../notifications.controller");
const service = require("../notifications.service");

describe("notifications.controller.create", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects attempts to create notifications for another user without admin rights", async () => {
    const req = {
      body: { user_id: "target-user", type: "info", message: "Hello" },
      user: { id: "requesting-user", roles: ["student"] },
    };
    const res = {};

    let capturedError;
    await new Promise((resolve) => {
      controller.create(req, res, (err) => {
        capturedError = err;
        resolve();
      });
    });

    expect(service.createNotification).not.toHaveBeenCalled();
    expect(capturedError).toBeInstanceOf(AppError);
    expect(capturedError.statusCode).toBe(403);
    expect(capturedError.message).toBe(
      "Unauthorized to create notifications for other users"
    );
  });
});
