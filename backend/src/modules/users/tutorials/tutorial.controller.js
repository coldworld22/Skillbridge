const logger = require("../../../utils/logger.js");
// 📁 src/modules/users/tutorials/tutorial.controller.js
const service = require("./tutorial.service");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const userModel = require("../user.model");
const analyticsService = require("../../../services/analyticsService");
const certificateService = require("./certificate/certificate.service");
const enrollmentService = require("./enrollments/tutorialEnrollment.service");
const AppError = require("../../../utils/AppError");
const { sendTutorialApprovedEmail, sendTutorialRejectedEmail } = require(
  "../../../utils/email"
);

const catchAsync = require("../../../utils/catchAsync");
const { v4: uuidv4 } = require("uuid");
const { getActiveInstructorPlan } = require("../../plans/instructor.helper");
const planService = require("../../plans/plans.service");
const { parsePlanFeatures } = require("../../../utils/planFeatures");
const tutorialValidator = require("./tutorial.validator");
const { normalizeRole } = require("../../../utils/role");


const { sendSuccess } = require("../../../utils/response");
const { parseTags, parseChapters } = require("./tutorial.helpers");
const { sendCreationNotifications } = require("./tutorial.notifications");
const { ZodError } = require("zod");
const slugify = require("slugify");

// Helper to resolve uploads subdirectory based on user role
const getRoleDir = (req) => {
  let role = normalizeRole(req.user?.role) || "other";
  if (["superadmin", "admin"].includes(role)) role = "admin";
  return role;
};

// Ensure the acting instructor owns the tutorial
const assertInstructorOwnsTutorial = async (userId, tutorialId) => {
  const tut = await service.getTutorialById(tutorialId);
  if (!tut) throw new AppError("Tutorial not found", 404);
  if (tut.instructor_id !== userId) throw new AppError("Access denied", 403);
};

exports.createTutorial = catchAsync(async (req, res) => {
  const userRole = normalizeRole(req.user?.role);
  const { body } = tutorialValidator.create.parse({ body: req.body });
  const {
    title,
    description,
    category_id,
    level,
    duration,
    price,
    status = "draft",
    tags: rawTags,
    chapters: rawChapters,
    included_plans = [],
    instructor_id: bodyInstructorId,
  } = body;

  const parsedChapters = parseChapters(rawChapters);
  const tags = parseTags(rawTags);

  let instructor_id;
  if (["admin", "superadmin"].includes(userRole) && bodyInstructorId) {
    const instructor = await userModel.findById(bodyInstructorId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }
    instructor_id = bodyInstructorId;
  } else {
    instructor_id = req.user.id;
  }

  if (userRole === "instructor") {
    const plan = await getActiveInstructorPlan(instructor_id);
    if (!plan) {
      throw new AppError("Active plan required", 403);
    }
    const fullPlan = await planService.getPlanById(plan.id);
    const features = parsePlanFeatures(fullPlan);
    if (!features["tutorials_create"]) {
      throw new AppError("Tutorial creation not allowed for your plan", 403);
    }
    const max = features["tutorials_max_count"];
    if (status === "published" && max) {
      const count = await service.countPublishedTutorials(instructor_id);
      if (count >= max) {
        throw new AppError("Tutorial limit reached for your plan", 403);
      }
    }
  }

  const id = uuidv4();
  const roleDir = getRoleDir(req);
  const thumbnailFile = req.files?.thumbnail?.[0];
  const previewFile = req.files?.preview?.[0];

  const baseSlug = slugify(title, { lower: true, strict: true });

  const tutorialData = {
    id,
    title,
    description,
    category_id,
    level,
    duration: duration ?? null,
    price,
    is_paid: Number(price) > 0,
    instructor_id,
    status,
    moderation_status: status === "published" ? "Pending" : null,
    included_plans,
    cover_image: thumbnailFile
      ? `/uploads/tutorials/${roleDir}/${thumbnailFile.filename}`
      : null,
    preview_video: previewFile
      ? `/uploads/tutorials/${roleDir}/${previewFile.filename}`
      : null,
    slug: baseSlug || id,
  };

  try {
    const tutorial = await service.createTutorialWithRelations(
      tutorialData,
      tags,
      parsedChapters
    );

    await sendCreationNotifications(instructor_id, title);

    sendSuccess(res, tutorial, "Tutorial with chapters created");
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ message: "Tutorial title already exists" });
    }
    throw err;
  }
});


exports.getAllTutorials = async (req, res) => {
  const { status, category, search, approval, page = 1, limit = 10 } = req.query;
  const result = await service.getAllTutorials({
    status,
    category,
    search,
    approval,
    page,
    limit,
  });
  sendSuccess(res, result.data, "Tutorials fetched", result.meta);
};

exports.getMyTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getTutorialsByInstructor(req.user.id);
  sendSuccess(res, tutorials);
});


exports.getTutorialById = catchAsync(async (req, res) => {
  const userId = req.user?.id || null;
  const tutorial = await service.getTutorialById(req.params.id, userId);

  if (!tutorial) {
    throw new AppError("Tutorial not found", 404);
  }

  sendSuccess(res, tutorial);
});


exports.updateTutorial = catchAsync(async (req, res) => {
  const userRole = normalizeRole(req.user?.role);
  if (userRole === "instructor") {
    await assertInstructorOwnsTutorial(req.user.id, req.params.id);
  }

  let body;
  try {
    ({ body } = await tutorialValidator.update.parseAsync({ body: req.body }));
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: err.errors,
      });
    }
    throw err;
  }

  const { tags: rawTags, ...data } = body;
  const roleDir = getRoleDir(req);
  if (req.files?.thumbnail) {
    data.cover_image = `/uploads/tutorials/${roleDir}/${req.files.thumbnail[0].filename}`;
  }
  if (req.files?.preview) {
    data.preview_video = `/uploads/tutorials/${roleDir}/${req.files.preview[0].filename}`;
  }
  const tutorial = await service.updateTutorial(req.params.id, data);
  if (!tutorial) {
    throw new AppError("Tutorial not found", 404);
  }

  let tags;
  if (rawTags !== undefined) {
    tags = parseTags(rawTags);
  }
  if (tags) {
    tutorial.tags = await service.updateTutorialTagsTransactional(
      tutorial.id,
      tags
    );
  }

  sendSuccess(res, tutorial);
});


exports.softDeleteTutorial = catchAsync(async (req, res) => {
  await service.updateStatus(req.params.id, { status: "archived" });

  sendSuccess(res, { message: "Archived" });
});


exports.restoreTutorial = catchAsync(async (req, res) => {
  await service.updateStatus(req.params.id, { status: "draft" });

  sendSuccess(res, { message: "Restored to draft" });
});


exports.permanentlyDeleteTutorial = catchAsync(async (req, res) => {
  const userRole = normalizeRole(req.user?.role);
  if (userRole === "instructor") {
    await assertInstructorOwnsTutorial(req.user.id, req.params.id);
  }
  await service.permanentlyDeleteTutorial(req.params.id);

  sendSuccess(res, { message: "Permanently deleted" });
});


exports.togglePublishStatus = catchAsync(async (req, res) => {
  const tutorialId = req.params.id;

  const userRole = normalizeRole(req.user?.role);

  if (userRole === "instructor") {
    await assertInstructorOwnsTutorial(req.user.id, tutorialId);
  }
  const existing = await service.getTutorialById(tutorialId);
  if (!existing) throw new AppError("Tutorial not found", 404);
  if (existing.status !== "published") {
    const plan = await getActiveInstructorPlan(existing.instructor_id);
    if (!plan) {
      throw new AppError("Active plan required", 403);
    }
    const fullPlan = await planService.getPlanById(plan.id);
    const features = parsePlanFeatures(fullPlan);
    if (!features["tutorials_create"]) {
      throw new AppError(
        "Tutorial publishing not allowed for your plan",
        403
      );
    }
    const max = features["tutorials_max_count"];
    if (max) {
      const count = await service.countPublishedTutorials(
        existing.instructor_id
      );
      if (count >= max) {
        throw new AppError("Tutorial limit reached for your plan", 403);
      }
    }
  }
  const updated = await service.togglePublishStatus(tutorialId);
  const tut = await service.getTutorialById(tutorialId);
  if (
    userRole !== "instructor" &&
    tut.instructor_id &&
    tut.instructor_id !== req.user.id
  ) {
    const message = `An admin changed the status of your tutorial "${tut.title}" to ${tut.status}`;
    await Promise.all([
      notificationService.createNotification({
        user_id: tut.instructor_id,
        type: "tutorial_status_changed",
        message,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: tut.instructor_id,
        message,
      }),
    ]);
  }

  sendSuccess(res, {
    message: "Status toggled",
    status: updated.status,
    moderation_status: updated.moderation_status,
  });
});


exports.approveTutorial = catchAsync(async (req, res) => {
  const tutorialId = req.params.id;
  await service.updateModeration(tutorialId, "Approved");

  const tut = await service.getTutorialById(tutorialId);
  if (tut.instructor_id && tut.instructor_id !== req.user.id) {
    const message = `Your tutorial "${tut.title}" has been approved`;
    await Promise.all([
      notificationService.createNotification({
        user_id: tut.instructor_id,
        type: "tutorial_approved",
        message: `Tutorial "${tut.title}" approved. You can now start teaching`,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: tut.instructor_id,
        message,
      }),
    ]);
    try {
      const instr = await userModel.findById(tut.instructor_id);
      if (instr) await sendTutorialApprovedEmail(instr.email, tut.title);
    } catch (err) {
      logger.error("Error sending tutorial approved email:", err.message);
    }
  }

  sendSuccess(res, { message: "Tutorial approved" });
});


exports.rejectTutorial = catchAsync(async (req, res) => {
  const tutorialId = req.params.id;
  const reason = req.body.reason;
  await service.updateModeration(tutorialId, "Rejected", reason);

  const tut = await service.getTutorialById(tutorialId);
  if (tut.instructor_id && tut.instructor_id !== req.user.id) {
    const msgReason = reason ? `: ${reason}` : "";
    const message = `Your tutorial "${tut.title}" was rejected${msgReason}`;
    await Promise.all([
      notificationService.createNotification({
        user_id: tut.instructor_id,
        type: "tutorial_rejected",
        message,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: tut.instructor_id,
        message,
      }),
    ]);
    try {
      const instr = await userModel.findById(tut.instructor_id);
      if (instr)
        await sendTutorialRejectedEmail(instr.email, tut.title, reason);
    } catch (err) {
      logger.error("Error sending tutorial rejected email:", err.message);
    }
  }

  sendSuccess(res, { message: "Tutorial rejected" });
});


exports.bulkApproveTutorials = catchAsync(async (req, res) => {
  const ids = req.body.ids || [];
  if (!ids.length) {
    return sendSuccess(res, { message: "Bulk approval done" });
  }

  await service.bulkUpdateModeration(ids, "Approved");

  const tutorials = await service.getTutorialsByIds(ids);
  await Promise.all(
    tutorials.map((tut) => {
      if (tut.instructor_id && tut.instructor_id !== req.user.id) {
        const message = `Your tutorial "${tut.title}" has been approved`;
        return Promise.all([
          notificationService.createNotification({
            user_id: tut.instructor_id,
            type: "tutorial_approved",
            message: `Tutorial "${tut.title}" approved. You can now start teaching`,
          }),
          messageService.createMessage({
            sender_id: req.user.id,
            receiver_id: tut.instructor_id,
            message,
          }),
          (async () => {
            try {
              const instr = await userModel.findById(tut.instructor_id);
              if (instr)
                await sendTutorialApprovedEmail(instr.email, tut.title);
            } catch (err) {
              logger.error(
                "Error sending tutorial approved email:",
                err.message
              );
            }
          })(),
        ]);
      }
      return Promise.resolve();
    })
  );

  sendSuccess(res, { message: "Bulk approval done" });
});


exports.bulkDeleteTutorials = catchAsync(async (req, res) => {
  await service.bulkDeleteTutorials(req.body.ids);

  sendSuccess(res, { message: "Selected tutorials deleted" });
});

exports.getArchivedTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getArchivedTutorials();

  sendSuccess(res, tutorials);
});


exports.getFeaturedTutorials = catchAsync(async (req, res) => {
  const featured = await service.getFeaturedTutorials();

  sendSuccess(res, featured);
});


exports.getPublishedTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getPublishedTutorials(req.query);

  sendSuccess(res, tutorials);
});


exports.getPublicTutorialDetails = catchAsync(async (req, res) => {
  const tutorial = await service.getPublicTutorialDetails(req.params.id);

  if (tutorial) {
    await service.recordTutorialView(
      req.params.id,
      req.user?.id,
      req.ip,
      req.headers["user-agent"]
    );
    tutorial.views = await service.getTutorialViewCount(req.params.id);

    if (req.user?.id) {
      const enrollment = await enrollmentService.findEnrollment(
        req.user.id,
        req.params.id
      );
      tutorial.is_enrolled = !!enrollment;
      tutorial.progress = enrollment?.progress || 0;

      tutorial.assignment_count = await service.getAssignmentCount(
        req.params.id
      );
      tutorial.assignments_locked = !enrollment;

      const cert = await certificateService.findExisting(
        req.user.id,
        req.params.id
      );
      if (cert) {
        tutorial.certificate_id = cert.id;
      }
      const completed = await certificateService.isUserCompletedTutorial(
        req.user.id,
        req.params.id
      );
      tutorial.certificate_locked = !completed;
    }
  }

  analyticsService.logEvent(req.user?.id || null, 'view_tutorial', {
    tutorialId: req.params.id,
  });

  sendSuccess(res, tutorial);
});
exports.getTutorialsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const tutorials = await service.getTutorialsByCategory(categoryId);
  sendSuccess(res, tutorials);
};


exports.getTutorialAnalytics = catchAsync(async (req, res) => {
  const data = await service.getTutorialAnalytics(req.params.id);
  sendSuccess(res, data);
});
