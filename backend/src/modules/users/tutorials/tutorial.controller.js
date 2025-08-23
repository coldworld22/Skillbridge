const logger = require('../../../utils/logger.js');
// 📁 src/modules/users/tutorials/tutorial.controller.js
const db = require("../../../config/database");
const service = require("./tutorial.service");
const chapterService = require("./chapters/tutorialChapter.service");
const tagService = require("./tutorialTag.service");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const userModel = require("../user.model");
const analyticsService = require("../../../services/analyticsService");
const certificateService = require("./certificate/certificate.service");
const enrollmentService = require("./enrollments/tutorialEnrollment.service");
const AppError = require("../../../utils/AppError");
const {
  sendTutorialCreatedAdminEmail,
  sendTutorialCreatedInstructorEmail,
  sendTutorialApprovedEmail,
  sendTutorialRejectedEmail,
} = require("../../../utils/email");

const catchAsync = require("../../../utils/catchAsync");
const { v4: uuidv4 } = require("uuid");


const { sendSuccess } = require("../../../utils/response");
const slugify = require("slugify");
const { parseTags } = require("./tutorial.helpers");

// Helper to resolve uploads subdirectory based on user role
const getRoleDir = (req) => {
  let role = req.user?.role?.toLowerCase() || "other";
  if (["superadmin", "admin"].includes(role)) role = "admin";
  return role;
};

// ✅ Helper: Generate a slug based on title
const generateUniqueSlug = (title) =>
  slugify(title, { lower: true, strict: true });

// Ensure the acting instructor owns the tutorial
const assertInstructorOwnsTutorial = async (userId, tutorialId) => {
  const tut = await service.getTutorialById(tutorialId);
  if (!tut) throw new AppError("Tutorial not found", 404);
  if (tut.instructor_id !== userId) throw new AppError("Access denied", 403);
};

exports.createTutorial = catchAsync(async (req, res) => {
  const {
    title,
    description,
    category_id,
    level,
    duration,
    price,
    status = "draft",
    tags: rawTags,
    chapters = [],
    instructor_id: bodyInstructorId,
  } = req.body;

  // In case chapters came as a serialized JSON string, parse it
  let parsedChapters = chapters;
  if (typeof parsedChapters === "string") {
    try {
      parsedChapters = JSON.parse(parsedChapters);
    } catch (err) {
      parsedChapters = [];
    }
  }

  // Filter out any chapter objects missing a title
  parsedChapters = Array.isArray(parsedChapters)
    ? parsedChapters.filter((ch) => ch && ch.title)
    : [];

  // 🚫 Prevent duplicate titles
  const existing = await db("tutorials")
    .whereRaw('LOWER(title) = ?', title.toLowerCase())
    .first();
  if (existing) {
    return res.status(400).json({ message: "Tutorial title already exists" });
  }

  let instructor = null;
  let instructor_id;
  if (
    ["admin", "superadmin"].includes(req.user.role) &&
    bodyInstructorId
  ) {
    instructor = await userModel.findById(bodyInstructorId);
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }
    instructor_id = bodyInstructorId;
  } else {
    instructor_id = req.user.id;
  }

  let slug = generateUniqueSlug(title);
  const id = uuidv4();

  const roleDir = getRoleDir(req);
  const thumbnailFile = req.files?.thumbnail?.[0];
  const previewFile = req.files?.preview?.[0];

  // Prepare tutorial data
  const tutorialData = {
    id,
    title,
    slug,
    description,
    category_id,
    level,
    duration: duration ?? null,
    price,
    is_paid: Number(price) > 0,
    instructor_id,
    status,
    moderation_status: status === "published" ? "Pending" : null,
    cover_image: thumbnailFile
      ? `/uploads/tutorials/${roleDir}/${thumbnailFile.filename}`
      : null,
    preview_video: previewFile
      ? `/uploads/tutorials/${roleDir}/${previewFile.filename}`
      : null,
  };

  // Parse tags safely
  const tags = parseTags(rawTags);

  let tutorial;
  await db.transaction(async (trx) => {
    try {
      tutorial = await service.createTutorial(tutorialData, trx);
    } catch (err) {
      if (err.code === "23505") {
        const randomSuffix = Math.random().toString(36).slice(2, 8);
        slug = `${slug}-${randomSuffix}`;
        tutorialData.slug = slug;
        tutorial = await service.createTutorial(tutorialData, trx);
      } else {
        throw err;
      }
    }

    if (tags.length) {
      const tagIds = [];
      for (const name of tags) {
        const existing = await tagService.findByName(name, trx);
        const tag =
          existing ||
          (await tagService.createTag(
            { name, slug: slugify(name, { lower: true, strict: true }) },
            trx
          ));
        tagIds.push(tag.id);
      }
      await service.addTutorialTags(id, tagIds, trx);
      tutorial.tags = await service.getTutorialTags(id, trx);
    }

    // Save chapters (if any)
    for (let i = 0; i < parsedChapters.length; i++) {
      const ch = parsedChapters[i];
      await chapterService.create(
        {
          id: uuidv4(),
          tutorial_id: id,
          title: ch.title,
          video_url: ch.video_url,
          duration: ch.duration,
          order: ch.order ?? i + 1,
          is_preview: ch.is_preview ?? false,
        },
        trx
      );
    }
  });

  await notificationService.createNotification({
    user_id: instructor_id,
    type: "tutorial_created",
    message:
      "New tutorial added successfully. It's under review and will be available after we approve it",
  });

  if (!instructor) {
    instructor = await userModel.findById(instructor_id);
  }
  const admins = await userModel.findAdmins();
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "new_tutorial",
        message: `Instructor ${instructor.full_name} added new tutorial \"${title}\" waiting for review`,
      })
    )
  );
  // Email admins about the new tutorial
  await Promise.all(
    admins.map((admin) =>
      sendTutorialCreatedAdminEmail(admin.email, instructor.full_name, title)
    )
  );

  // Send direct messages to admins about the new tutorial
  if (admins.length) {
    await Promise.all(
      admins.map((admin) =>
        messageService.createMessage({
          sender_id: instructor_id,
          receiver_id: admin.id,
          message: `New tutorial \"${title}\" created by ${instructor.full_name} and awaiting your review`,
        })
      )
    );
  }

  // Optional message to the instructor confirming creation
  await messageService.createMessage({
    sender_id: instructor_id,
    receiver_id: instructor_id,
    message: "Your tutorial was submitted and is pending review",
  });
  try {
    await sendTutorialCreatedInstructorEmail(instructor.email, title);
  } catch (err) {
    logger.error("Error sending tutorial created email:", err.message);
  }

  sendSuccess(res, tutorial, "Tutorial with chapters created");
});


exports.getAllTutorials = async (req, res) => {
  const { status, category, search, page = 1, limit = 10 } = req.query;
  const result = await service.getAllTutorials({
    status,
    category,
    search,
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
  if (req.user.role === "instructor") {
    await assertInstructorOwnsTutorial(req.user.id, req.params.id);
  }
  const { tags: rawTags, ...data } = req.body;
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
    const trx = await db.transaction();
    try {
      await service.updateTutorialTags(tutorial.id, tags, trx);
      await trx.commit();
      tutorial.tags = await service.getTutorialTags(tutorial.id);
    } catch (err) {
      await trx.rollback();
      throw err;
    }
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
  if (req.user.role === "instructor") {
    await assertInstructorOwnsTutorial(req.user.id, req.params.id);
  }
  await service.permanentlyDeleteTutorial(req.params.id);

  sendSuccess(res, { message: "Permanently deleted" });
});


exports.togglePublishStatus = catchAsync(async (req, res) => {
  const tutorialId = req.params.id;

  if (req.user.role === "instructor") {
    await assertInstructorOwnsTutorial(req.user.id, tutorialId);
  }
  const updated = await service.togglePublishStatus(tutorialId);
  if (!updated) {
    throw new AppError("Tutorial not found", 404);
  }

  const tut = await service.getTutorialById(tutorialId);
  if (
    req.user.role !== "instructor" &&
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
