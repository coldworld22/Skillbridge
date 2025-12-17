const path = require("path");

jest.mock("fs", () => {
  const realFs = jest.requireActual("fs");
  return {
    ...realFs,
    existsSync: jest.fn(() => true),
    statSync: jest.fn(() => ({ size: 888 })),
    unlinkSync: jest.fn(),
  };
});

jest.mock("../src/config/database", () => {
  const stub = () => stub;
  stub.select = () => stub;
  stub.where = () => stub;
  stub.first = () => Promise.resolve({ instructor_id: "u1" });
  stub.fn = { now: jest.fn() };
  return stub;
});

jest.mock("../src/modules/users/tutorials/chapters/tutorialChapter.service", () => ({
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("../src/middleware/storage", () => ({
  subtractStorageUsage: jest.fn(),
}));

const fs = require("fs");
const ctrl = require("../src/modules/users/tutorials/chapters/tutorialChapter.controller");
const service = require("../src/modules/users/tutorials/chapters/tutorialChapter.service");
const { subtractStorageUsage } = require("../src/middleware/storage");

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("tutorialChapter.controller media cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updateChapter removes old video and subtracts storage when video_url changes", async () => {
    service.findById.mockResolvedValue({
      id: "ch1",
      tutorial_id: "tut1",
      tenant_id: "t-existing",
      video_url: "/uploads/tutorials/chapters/admin/old-video.mp4",
    });
    service.update.mockResolvedValue({ id: "ch1" });

    const req = {
      params: { id: "ch1" },
      user: { id: "u1", role: "admin" },
      tenant: { id: "t-req" },
      body: { video_url: "/uploads/tutorials/chapters/admin/new-video.mp4" },
    };
    const res = makeRes();

    await ctrl.updateChapter(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith(
      path.join(__dirname, "../src/modules/users/tutorials/../../../..", "/uploads/tutorials/chapters/admin/old-video.mp4"),
    );
    expect(subtractStorageUsage).toHaveBeenCalledWith("t-req", 888);
    expect(service.update).toHaveBeenCalledWith(
      "ch1",
      expect.objectContaining({ video_url: "/uploads/tutorials/chapters/admin/new-video.mp4", tenant_id: "t-req" }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deleteChapter removes video and subtracts storage", async () => {
    service.findById.mockResolvedValue({
      id: "ch2",
      tutorial_id: "tut1",
      tenant_id: "t-existing",
      video_url: "/uploads/tutorials/chapters/admin/old-del.mp4",
    });
    service.delete.mockResolvedValue();

    const req = {
      params: { id: "ch2" },
      user: { id: "u1", role: "admin" },
      tenant: { id: "t-req" },
    };
    const res = makeRes();

    await ctrl.deleteChapter(req, res);

    expect(fs.unlinkSync).toHaveBeenCalledWith(
      path.join(__dirname, "../src/modules/users/tutorials/../../../..", "/uploads/tutorials/chapters/admin/old-del.mp4"),
    );
    expect(subtractStorageUsage).toHaveBeenCalledWith("t-req", 888);
    expect(service.delete).toHaveBeenCalledWith("ch2");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
