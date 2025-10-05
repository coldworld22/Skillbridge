const mockDb = jest.fn();

jest.mock("../src/config/database", () => mockDb);
jest.mock("../src/utils/logger.js", () => ({
  error: jest.fn(),
}));

const mockSendSuccess = jest.fn();
jest.mock("../src/utils/response", () => ({
  sendSuccess: (...args) => mockSendSuccess(...args),
}));

const mockClassService = {
  createClass: jest.fn(),
  addClassTags: jest.fn(),
  getClassTags: jest.fn(),
  countPublishedClasses: jest.fn(),
};
jest.mock("../src/modules/classes/class.service", () => mockClassService);

const mockTagService = {
  findByName: jest.fn(),
  createTag: jest.fn(),
};
jest.mock("../src/modules/classes/classTag.service", () => mockTagService);

const mockNotificationService = {
  createNotification: jest.fn(() => Promise.resolve()),
};
jest.mock("../src/modules/notifications/notifications.service", () => mockNotificationService);

const mockMessageService = {
  createMessage: jest.fn(() => Promise.resolve()),
};
jest.mock("../src/modules/messages/messages.service", () => mockMessageService);

const mockUserModel = {
  findAdmins: jest.fn(),
  findById: jest.fn(),
};
jest.mock("../src/modules/users/user.model", () => mockUserModel);

const mockPlanHelper = {
  getActiveInstructorPlan: jest.fn(),
};
jest.mock("../src/modules/plans/instructor.helper", () => mockPlanHelper);

const mockPlanService = {
  getPlanById: jest.fn(),
};
jest.mock("../src/modules/plans/plans.service", () => mockPlanService);

const mockPlanFeatures = {
  parsePlanFeatures: jest.fn(),
};
jest.mock("../src/utils/planFeatures", () => mockPlanFeatures);

const classController = require("../src/modules/classes/class.controller");

const createHandler = classController.createClass;

const flushHandler = (handler, req, res) => {
  return new Promise((resolve, reject) => {
    mockSendSuccess.mockImplementation((...args) => {
      resolve(args);
    });

    handler(req, res, (err) => {
      if (err) {
        reject(err);
      }
    });
  });
};

describe("createClass controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockDb.mockImplementation(() => ({
      where: jest.fn().mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      }),
    }));

    mockPlanHelper.getActiveInstructorPlan.mockResolvedValue({
      id: "plan-id",
      max_courses: null,
    });

    mockPlanService.getPlanById.mockResolvedValue({ id: "plan-id" });
    mockPlanFeatures.parsePlanFeatures.mockReturnValue({ classes_create: true });
  });

  it("responds with success for admin initiated creation", async () => {
    const req = {
      body: {
        title: "Admin Class",
        status: "published",
        publish_immediately: "true",
        instructor_id: "instructor-123",
      },
      user: {
        roles: ["admin"],
      },
    };

    const res = {};

    mockClassService.createClass.mockResolvedValue({
      id: "class-id",
      title: "Admin Class",
      instructor_id: "instructor-123",
      moderation_status: "Approved",
    });

    const [response, data, message] = await flushHandler(createHandler, req, res);

    expect(response).toBe(res);
    expect(data).toEqual(
      expect.objectContaining({ id: "class-id", title: "Admin Class" })
    );
    expect(message).toBe("Class created");
    expect(mockPlanHelper.getActiveInstructorPlan).toHaveBeenCalledWith(
      "instructor-123"
    );
    expect(mockSendSuccess).toHaveBeenCalledTimes(1);
  });

  it("responds with success for instructor initiated creation", async () => {
    const req = {
      body: {
        title: "Instructor Class",
        status: "draft",
        publish_immediately: "true",
      },
      user: {
        role: "instructor",
        id: "instructor-321",
      },
    };

    const res = {};

    mockClassService.createClass.mockResolvedValue({
      id: "class-two",
      title: "Instructor Class",
      instructor_id: "instructor-321",
      moderation_status: "Approved",
    });

    const [response, data, message] = await flushHandler(createHandler, req, res);

    expect(response).toBe(res);
    expect(data).toEqual(
      expect.objectContaining({ id: "class-two", instructor_id: "instructor-321" })
    );
    expect(message).toBe("Class created");
    expect(mockPlanHelper.getActiveInstructorPlan).toHaveBeenCalledWith(
      "instructor-321"
    );
    expect(mockPlanService.getPlanById).toHaveBeenCalledWith("plan-id");
    expect(mockPlanFeatures.parsePlanFeatures).toHaveBeenCalledWith({ id: "plan-id" });
    expect(mockSendSuccess).toHaveBeenCalledTimes(1);
  });
});
