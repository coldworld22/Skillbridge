jest.mock("../../../../../config/database", () => jest.fn());
const db = require("../../../../../config/database");
const { isUserCompletedTutorial } = require("../certificate.service");

describe("isUserCompletedTutorial", () => {
  beforeEach(() => {
    db.mockReset();
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

