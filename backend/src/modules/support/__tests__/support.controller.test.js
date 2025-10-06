jest.mock("../../../config/database", () => jest.fn());

jest.mock("../../../utils/response", () => ({
  sendSuccess: jest.fn(),
}));

jest.mock("../support.service", () => ({
  uploadAttachment: jest.fn(),
}));

const { sendSuccess } = require("../../../utils/response");
const service = require("../support.service");
const AppError = require("../../../utils/AppError");
const controller = require("../support.controller");

describe("support.controller.uploadAttachment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the service and returns the persisted attachment", async () => {
    const req = {
      file: { filename: "file", originalname: "name.txt" },
      params: { messageId: "message-1" },
      user: { id: "user-1" },
    };
    const res = {};
    const next = jest.fn();
    const attachment = { id: "attachment-1" };

    service.uploadAttachment.mockResolvedValue(attachment);

    await controller.uploadAttachment(req, res, next);

    expect(service.uploadAttachment).toHaveBeenCalledWith({
      messageId: "message-1",
      file: req.file,
      user: req.user,
    });
    expect(sendSuccess).toHaveBeenCalledWith(
      res,
      attachment,
      "Attachment uploaded"
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects requests without an uploaded file", async () => {
    const req = {
      file: null,
      params: { messageId: "message-1" },
      user: { id: "user-1" },
    };
    const res = {};
    const next = jest.fn();

    await controller.uploadAttachment(req, res, next);

    expect(service.uploadAttachment).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("No file uploaded");
  });

  it("propagates authorization errors from the service", async () => {
    const req = {
      file: { filename: "file" },
      params: { messageId: "message-1" },
      user: { id: "user-2" },
    };
    const res = {};
    const next = jest.fn();
    const authError = new AppError("Access denied", 403);

    service.uploadAttachment.mockRejectedValue(authError);

    await controller.uploadAttachment(req, res, next);

    expect(next).toHaveBeenCalledWith(authError);
    expect(sendSuccess).not.toHaveBeenCalled();
  });
});
