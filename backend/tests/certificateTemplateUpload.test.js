const request = require("supertest");
const express = require("express");

// Mock authentication to bypass middleware protections
jest.mock("../src/middleware/auth/authMiddleware", () => ({
  verifyToken: jest.fn((req, _res, next) => {
    req.user = { id: "admin", role: "admin", roles: ["admin"] };
    next();
  }),
  isAdmin: (_req, _res, next) => next(),
}));

// Import routes after mocking auth middleware
const routes = require("../src/modules/certificateTemplates/certificateTemplates.routes");

const app = express();
app.use(express.json());
app.use("/api/certificate-templates", routes);

describe("POST /api/certificate-templates/upload", () => {
  it("returns a URL under /api/uploads", async () => {
    const res = await request(app)
      .post("/api/certificate-templates/upload")
      .attach("file", Buffer.from("dummy"), {
        filename: "test.png",
        contentType: "image/png",
      });

    expect(res.status).toBe(200);
    expect(res.body.data.url).toMatch(/^\/api\/uploads\/certificateTemplates\//);
  });
});

