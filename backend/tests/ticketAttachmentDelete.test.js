const path = require("path");

jest.mock("fs", () => {
  const realFs = jest.requireActual("fs");
  return {
    ...realFs,
    existsSync: jest.fn(() => true),
    statSync: jest.fn(() => ({ size: 123 })),
    unlinkSync: jest.fn(),
  };
});

jest.mock("../src/modules/tickets/tickets.service", () => ({
  deleteAttachment: jest.fn(),
}));

jest.mock("../src/middleware/storage", () => ({
  subtractStorageUsage: jest.fn(),
}));

const fs = require("fs");
const { deleteAttachment } = require("../src/modules/tickets/tickets.controller");
const ticketsService = require("../src/modules/tickets/tickets.service");
const { subtractStorageUsage } = require("../src/middleware/storage");

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("tickets.controller deleteAttachment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes file and subtracts storage when attachment exists", async () => {
    ticketsService.deleteAttachment.mockResolvedValue({
      file_path: "/uploads/ticket_attachments/foo.txt",
    });
    const req = { params: { attachmentId: "att1" }, tenant: { id: "t1" } };
    const res = makeRes();

    await deleteAttachment(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith(
      path.join(
        __dirname,
        "../src/modules/tickets/../../..",
        "/uploads/ticket_attachments/foo.txt",
      ),
    );
    expect(subtractStorageUsage).toHaveBeenCalledWith("t1", 123);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Attachment deleted" }),
    );
  });

  it("404s when attachment not found", async () => {
    ticketsService.deleteAttachment.mockResolvedValue(null);
    const req = { params: { attachmentId: "missing" }, tenant: { id: "t1" } };
    const res = makeRes();

    await expect(deleteAttachment(req, res)).rejects.toMatchObject({
      message: "Attachment not found",
    });
    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(subtractStorageUsage).not.toHaveBeenCalled();
  });
});
