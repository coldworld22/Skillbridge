const path = require("path");

jest.mock("fs", () => {
  const realFs = jest.requireActual("fs");
  return {
    ...realFs,
    existsSync: jest.fn(() => true),
    statSync: jest.fn(() => ({ size: 777 })),
    unlinkSync: jest.fn(),
  };
});

jest.mock("../src/modules/users/tutorials/tutorial.service", () => ({
  getTutorialById: jest.fn(),
  updateTutorial: jest.fn(),
  updateTutorialTags: jest.fn(),
  getTutorialTags: jest.fn(),
}));

jest.mock("../src/middleware/storage", () => ({
  subtractStorageUsage: jest.fn(),
}));

const fs = require("fs");
const controller = require("../src/modules/users/tutorials/tutorial.controller");
const service = require("../src/modules/users/tutorials/tutorial.service");
const { subtractStorageUsage } = require("../src/middleware/storage");

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("tutorial.controller updateTutorial media cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("removes old media, subtracts storage, and updates with new paths", async () => {
    service.getTutorialById.mockResolvedValue({
      id: "tut1",
      cover_image: "/uploads/tutorials/admin/old-thumb.jpg",
      preview_video: "/uploads/tutorials/admin/old-prev.mp4",
      tenant_id: "t-existing",
    });
    service.updateTutorial.mockResolvedValue({ id: "tut1" });

    const req = {
      user: { id: "u1", role: "admin" },
      tenant: { id: "t-req" },
      params: { id: "tut1" },
      files: {
        thumbnail: [{ filename: "new-thumb.jpg" }],
        preview: [{ filename: "new-prev.mp4" }],
      },
      body: {},
    };
    const res = makeRes();

    await controller.updateTutorial(req, res);

    // old files removed
    expect(fs.unlinkSync).toHaveBeenCalledWith(
      expect.stringContaining("/uploads/tutorials/admin/old-thumb.jpg"),
    );
    expect(fs.unlinkSync).toHaveBeenCalledWith(
      expect.stringContaining("/uploads/tutorials/admin/old-prev.mp4"),
    );
    // storage decremented for each
    expect(subtractStorageUsage).toHaveBeenCalledTimes(2);
    expect(subtractStorageUsage).toHaveBeenCalledWith("t-req", 777);

    // updated with new media paths and tenant_id propagated
    expect(service.updateTutorial).toHaveBeenCalledWith("tut1", expect.objectContaining({
      cover_image: "/uploads/tutorials/admin/new-thumb.jpg",
      preview_video: "/uploads/tutorials/admin/new-prev.mp4",
      tenant_id: "t-req",
    }));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
