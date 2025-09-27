jest.mock("../../../../../config/database", () => jest.fn());
jest.mock("../../../../certificateTemplates/certificateTemplates.service", () => ({
  getActiveTemplate: jest.fn(),
}));

const db = require("../../../../../config/database");
const templateService = require("../../../../certificateTemplates/certificateTemplates.service");
const {
  isUserCompletedTutorial,
  issueCertificate,
  resolveTemplateId,
} = require("../certificate.service");

describe("isUserCompletedTutorial", () => {
  beforeEach(() => {
    db.mockReset();
    templateService.getActiveTemplate.mockReset();
  });

  test("returns true when progress is 100 and all assignments are passed", async () => {
    const enrollmentQuery = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: "enr" }),
    };
    const assignmentQuery = {
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ count: 2 }]),
    };
    const submissionQuery = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ count: 2 }]),
    };
    db.mockImplementation((table) => {
      if (table === "tutorial_enrollments") return enrollmentQuery;
      if (table === "tutorial_assignments") return assignmentQuery;
      if (table === "assignment_submissions as s") return submissionQuery;
    });

    const res = await isUserCompletedTutorial("u1", "t1");
    expect(res).toBe(true);
  });

  test("returns false when assignments are missing or not passed", async () => {
    const enrollmentQuery = {
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({ id: "enr" }),
    };
    const assignmentQuery = {
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ count: 2 }]),
    };
    const submissionQuery = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      count: jest.fn().mockResolvedValue([{ count: 1 }]),
    };
    db.mockImplementation((table) => {
      if (table === "tutorial_enrollments") return enrollmentQuery;
      if (table === "tutorial_assignments") return assignmentQuery;
      if (table === "assignment_submissions as s") return submissionQuery;
    });

    const res = await isUserCompletedTutorial("u1", "t1");
    expect(res).toBe(false);
  });
});

describe("certificate templates", () => {
  beforeEach(() => {
    db.mockReset();
    templateService.getActiveTemplate.mockReset();
  });

  test("resolveTemplateId returns provided id", async () => {
    const id = await resolveTemplateId("tpl-provided");
    expect(id).toBe("tpl-provided");
    expect(templateService.getActiveTemplate).not.toHaveBeenCalled();
  });

  test("resolveTemplateId fetches default when missing", async () => {
    templateService.getActiveTemplate.mockResolvedValue({ id: "tpl-default" });
    const id = await resolveTemplateId();
    expect(id).toBe("tpl-default");
    expect(templateService.getActiveTemplate).toHaveBeenCalled();
  });

  test("issueCertificate attaches resolved template id", async () => {
    templateService.getActiveTemplate.mockResolvedValue({ id: "tpl-default" });
    const insert = jest.fn().mockResolvedValue([]);
    db.mockImplementation((table) => {
      if (table === "certificates") {
        return { insert };
      }
      return {
        where: () => ({ first: () => Promise.resolve(null) }),
      };
    });

    const cert = await issueCertificate({ userId: "u1", tutorialId: "t1" });

    expect(cert.template_id).toBe("tpl-default");
    expect(insert).toHaveBeenCalledWith(cert);
  });
});

