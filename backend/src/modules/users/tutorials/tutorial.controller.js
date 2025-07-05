// 📁 src/modules/users/tutorials/tutorial.controller.js
const path = require("path");
const fs = require("fs");
const db = require("../../../config/database"); // ✅ Required for slug check
const service = require("./tutorial.service");
const chapterService = require("./chapters/tutorialChapter.service");
const tagService = require("./tutorialTag.service");
const notificationService = require("../../notifications/notifications.service");
const messageService = require("../../messages/messages.service");
const userModel = require("../user.model");
const analyticsService = require("../../../services/analyticsService");

const catchAsync = require("../../../utils/catchAsync");
const { v4: uuidv4 } = require("uuid");


const { sendSuccess } = require("../../../utils/response");
const slugify = require("slugify");

// Helper to resolve uploads subdirectory based on user role
const getRoleDir = (req) => {
  let role = req.user?.role?.toLowerCase() || "other";
  if (["superadmin", "admin"].includes(role)) role = "admin";
  return role;
};

// ✅ Helper: Generate a unique slug based on title
const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let count = 1;

  while (await db("tutorials").where({ slug }).first()) {
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
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
  const existing = await db("tutorials").where({ title }).first();
  if (existing) {
    return res.status(400).json({ message: "Tutorial title already exists" });
  }

  const instructor_id = req.user.id;
  const slug = await generateUniqueSlug(title);
  const id = uuidv4();

  const roleDir = getRoleDir(req);
  const thumbnailFile = req.files?.thumbnail?.[0];
  const previewFile = req.files?.preview?.[0];

  // Save tutorial
  const tutorial = {
    id,
    title,
    slug,
    description,
    category_id,
    level,
    duration: duration ? parseInt(duration) : null,
    price,
    instructor_id,
    status,
    moderation_status: status === "published" ? "Pending" : null,
    thumbnail_url: thumbnailFile
      ? `/uploads/tutorials/${roleDir}/${thumbnailFile.filename}`
      : null,
    preview_video: previewFile
      ? `/uploads/tutorials/${roleDir}/${previewFile.filename}`
      : null,
  };
  await service.createTutorial(tutorial);

  const tags = rawTags
    ? typeof rawTags === "string"
      ? JSON.parse(rawTags)
      : rawTags
    : [];
  if (tags.length) {
    const tagIds = [];
    for (const name of tags) {
      const existing = await tagService.findByName(name);
      const tag =
        existing ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addTutorialTags(id, tagIds);
    tutorial.tags = await service.getTutorialTags(id);
  }

  // Save chapters (if any)
  for (let i = 0; i < parsedChapters.length; i++) {
    const ch = parsedChapters[i];
    await chapterService.create({
      id: uuidv4(),
      tutorial_id: id,
      title: ch.title,
      video_url: ch.video_url,
      duration: ch.duration,
      order: ch.order ?? i + 1,
      is_preview: ch.is_preview ?? false,
    });
  }

  await notificationService.createNotification({
    user_id: instructor_id,
    type: "tutorial_created",
    message:
      "New tutorial added successfully. It's under review and will be available after we approve it",
  });

  const instructor = await userModel.findById(instructor_id);
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

  sendSuccess(res, tutorial, "Tutorial with chapters created");
});


exports.getAllTutorials = async (req, res) => {
  const tutorials = await service.getAllTutorials(req.query);
  sendSuccess(res, tutorials);
};

exports.getMyTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getTutorialsByInstructor(req.user.id);
  sendSuccess(res, tutorials);
});


exports.getTutorialById = catchAsync(async (req, res) => {
  const tutorial = await service.getTutorialById(req.params.id);

  sendSuccess(res, tutorial);
});


exports.updateTutorial = catchAsync(async (req, res) => {
  const { tags: rawTags, ...data } = req.body;
  if (data.duration) {
    data.duration = parseInt(data.duration);
  }
  const roleDir = getRoleDir(req);
  if (req.files?.thumbnail) {
    data.thumbnail_url = `/uploads/tutorials/${roleDir}/${req.files.thumbnail[0].filename}`;
  }
  if (req.files?.preview) {
    data.preview_video = `/uploads/tutorials/${roleDir}/${req.files.preview[0].filename}`;
  }
  const tutorial = await service.updateTutorial(req.params.id, data);

  const tags = rawTags ? (typeof rawTags === 'string' ? JSON.parse(rawTags) : rawTags) : null;
  if (tags) {
    await db('tutorial_tag_map').where({ tutorial_id: tutorial.id }).del();
    const tagIds = [];
    for (const name of tags) {
      const existing = await tagService.findByName(name);
      const tag =
        existing ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addTutorialTags(tutorial.id, tagIds);
    tutorial.tags = await service.getTutorialTags(tutorial.id);
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
  await service.permanentlyDeleteTutorial(req.params.id);

  sendSuccess(res, { message: "Permanently deleted" });
});


exports.togglePublishStatus = catchAsync(async (req, res) => {
  const tutorialId = req.params.id;
  await service.togglePublishStatus(tutorialId);

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

  sendSuccess(res, { message: "Status toggled" });
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
  }

  sendSuccess(res, { message: "Tutorial rejected" });
});

exports.suspendTutorial = catchAsync(async (req, res) => {
  const tutorialId = req.params.id;
  await service.suspendTutorial(tutorialId);

  const tut = await service.getTutorialById(tutorialId);
  if (tut.instructor_id && tut.instructor_id !== req.user.id) {
    const message = `Your tutorial "${tut.title}" was suspended by an admin`;
    await Promise.all([
      notificationService.createNotification({
        user_id: tut.instructor_id,
        type: "tutorial_suspended",
        message,
      }),
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: tut.instructor_id,
        message,
      }),
    ]);
  }

  sendSuccess(res, { message: "Tutorial suspended" });
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
