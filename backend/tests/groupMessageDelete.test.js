const path = require("path");

jest.mock("fs", () => {
  const realFs = jest.requireActual("fs");
  return {
    ...realFs,
    existsSync: jest.fn(() => true),
    statSync: jest.fn(() => ({ size: 321 })),
    unlinkSync: jest.fn(),
  };
});

jest.mock("../src/modules/groups/groupMessages.service", () => ({
  deleteMessage: jest.fn(),
}));

jest.mock("../src/middleware/storage", () => ({
  subtractStorageUsage: jest.fn(),
}));

const fs = require("fs");
const {
  deleteMessage,
} = require("../src/modules/groups/groupMessages.controller");
const msgService = require("../src/modules/groups/groupMessages.service");
const { subtractStorageUsage } = require("../src/middleware/storage");

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("groupMessages.controller deleteMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes attachments and subtracts storage", async () => {
    msgService.deleteMessage.mockResolvedValue({
      id: "m1",
      file_url: "/uploads/chat/file1.txt",
      audio_url: "/uploads/chat/audio1.mp3",
      tenant_id: "t-from-row",
    });
    const req = { params: { id: "m1" }, user: { id: "u1" }, tenant: { id: "t-req" } };
    const res = makeRes();

    await deleteMessage(req, res);

    expect(msgService.deleteMessage).toHaveBeenCalledWith("u1", "m1");
    expect(fs.unlinkSync).toHaveBeenCalledWith(
      path.join(__dirname, "../src/modules/groups/../../..", "/uploads/chat/file1.txt"),
    );
    expect(fs.unlinkSync).toHaveBeenCalledWith(
      path.join(__dirname, "../src/modules/groups/../../..", "/uploads/chat/audio1.mp3"),
    );
    // two attachments => two subtracts with req tenant id
    expect(subtractStorageUsage).toHaveBeenCalledTimes(2);
    expect(subtractStorageUsage).toHaveBeenCalledWith("t-req", 321);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Message deleted" }),
    );
  });

  it("throws when message not found", async () => {
    msgService.deleteMessage.mockResolvedValue(null);
    const req = { params: { id: "missing" }, user: { id: "u1" }, tenant: { id: "t1" } };
    const res = makeRes();

    await expect(deleteMessage(req, res)).rejects.toMatchObject({
      message: "Message not found",
    });
    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(subtractStorageUsage).not.toHaveBeenCalled();
  });
});
