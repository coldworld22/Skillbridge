const request = require("supertest");
const express = require("express");
const path = require("path");
const fs = require("fs");

// Increase timeout for handling large buffers
jest.setTimeout(20000);

const uploadVideo = require("../src/middleware/videoUploadMiddleware");

const app = express();
app.post("/upload", (req, res) => {
  // Mock authenticated user for filename generation
  req.user = { id: "test" };
  uploadVideo.single("video")(req, res, (err) => {
    if (err) {
      return res.status(400).send(err.code);
    }
    res.status(200).send("ok");
  });
});

afterAll(() => {
  // Clean up any partially uploaded files
  const dir = path.join(__dirname, "../src/uploads/demo-videos");
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("videoUploadMiddleware", () => {
  it("rejects uploads larger than 100MB", async () => {
    const largeBuffer = Buffer.alloc(101 * 1024 * 1024); // 101MB
    const res = await request(app)
      .post("/upload")
      .attach("video", largeBuffer, { filename: "large.mp4", contentType: "video/mp4" });

    expect(res.status).toBe(400);
    expect(res.text).toBe("LIMIT_FILE_SIZE");
  });
});
