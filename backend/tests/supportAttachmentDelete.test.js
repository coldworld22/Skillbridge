const path = require("path");

jest.mock("fs", () => {
  const realFs = jest.requireActual("fs");
  return {
    ...realFs,
    existsSync: jest.fn(() => true),
    statSync: jest.fn(() => ({ size: 456 })),
    unlinkSync: jest.fn(),
  };
});

jest.mock("../src/modules/support/support.service", () => ({
  deleteAttachment: jest.fn(),
}));

jest.mock("../src/middleware/storage", () => ({
  subtractStorageUsage: jest.fn(),
}));

const fs = require("fs");
const { deleteAttachment } = require("../src/modules/support/support.controller");
const supportService = require("../src/modules/support/support.service");
const { subtractStorageUsage } = require("../src/middleware/storage");

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("support.controller deleteAttachment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes file and subtracts storage when attachment exists", async () => {
    supportService.deleteAttachment.mockResolvedValue({
      file_url: "/uploads/support_attachments/bar.txt",
    });
    const req = { params: { attachmentId: "att1" }, tenant: { id: "t1" } };
    const res = makeRes();

    await deleteAttachment(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith(
      path.join(
        __dirname,
        "../src/modules/support/../../..",
        "/uploads/support_attachments/bar.txt",
      ),
    );
    expect(subtractStorageUsage).toHaveBeenCalledWith("t1", 456);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Attachment deleted" }),
    );
  });

  it("404s when attachment not found", async () => {
    supportService.deleteAttachment.mockResolvedValue(null);
    const req = { params: { attachmentId: "missing" }, tenant: { id: "t1" } };
    const res = makeRes();

    await expect(deleteAttachment(req, res)).rejects.toMatchObject({
      message: "Attachment not found",
    });
    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(subtractStorageUsage).not.toHaveBeenCalled();
  });
});
