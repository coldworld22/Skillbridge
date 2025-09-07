const request = require("supertest");
const express = require("express");

const TUTORIAL_ID = '123e4567-e89b-12d3-a456-426614174001';

jest.mock("../../../../../config/database", () => {
  const db = jest.fn(() => db);
  db.where = jest.fn(() => db);
  db.first = jest.fn(() => Promise.resolve({ id: TUTORIAL_ID, title: "Tut" }));
  return db;
});

jest.mock("../certificate.service", () => ({
  isUserCompletedTutorial: jest.fn(),
  findExisting: jest.fn(),
  issueCertificate: jest.fn(),
}));

jest.mock("../../../../notifications/notifications.service", () => ({
  createNotification: jest.fn(() => Promise.resolve({})),
}));

jest.mock("../../../../../middleware/auth/authMiddleware", () => ({
  verifyToken: (req, _res, next) => {
    req.user = { id: "user1" };
    next();
  },
  isStudent: (_req, _res, next) => next(),
}));

const routes = require("../tutorialCertificate.routes");
const service = require("../certificate.service");

const app = express();
app.use(express.json());
app.use("/api/users/tutorials/certificate", routes);

describe("generate certificate route", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 403 when tutorial is not fully completed", async () => {
    service.isUserCompletedTutorial.mockResolvedValue(false);

    const res = await request(app).post(
      `/api/users/tutorials/certificate/${TUTORIAL_ID}/certificate/generate`,
    );

    expect(res.statusCode).toBe(403);
  });

  test("issues certificate when requirements are met", async () => {
    service.isUserCompletedTutorial.mockResolvedValue(true);
    service.findExisting.mockResolvedValue(null);
    service.issueCertificate.mockResolvedValue({ id: "cert1" });

    const res = await request(app).post(
      `/api/users/tutorials/certificate/${TUTORIAL_ID}/certificate/generate`,
    );

    expect(res.statusCode).toBe(200);
    expect(service.issueCertificate).toHaveBeenCalled();
  });
});

