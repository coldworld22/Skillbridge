const logger = require('../../utils/logger.js');
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./class.service");
const tagService = require("./classTag.service");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");
const userModel = require("../users/user.model");

const slugify = require("slugify");
const db = require("../../config/database");

const fs = require("fs");
const path = require("path");

const generateUniqueSlug = async (title) => {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let count = 1;
  while (await db("online_classes").where({ slug }).first()) {
    slug = `${base}-${count++}`;
  }
  return slug;
};

exports.createClass = catchAsync(async (req, res) => {
  const slug = await generateUniqueSlug(req.body.title);
  const { tags: rawTags, status, included_plans, access_type, ...body } = req.body;
  const data = {
    ...body,
    id: uuidv4(),
    slug,
    status: status === "published" ? "published" : "draft",
    moderation_status: "Pending",
  };
  if (included_plans) {
    try {
      data.included_plans = JSON.parse(included_plans);
    } catch {
      data.included_plans = included_plans;
    }
  }
  if (access_type) {
    data.access_type = access_type;
  }
  if (req.user?.role === "instructor") {
    data.instructor_id = req.user.id;
  }
  if (req.files?.cover_image?.[0]) {
    data.cover_image = `/uploads/classes/${req.files.cover_image[0].filename}`;
  }
  if (req.files?.demo_video?.[0]) {
    data.demo_video_url = `/uploads/classes/${req.files.demo_video[0].filename}`;
  }
  const tags = rawTags ? JSON.parse(rawTags) : [];
  const cls = await service.createClass(data);
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
    await service.addClassTags(cls.id, tagIds);
    cls.tags = await service.getClassTags(cls.id);
  }
  notificationService
    .createNotification({
      user_id: cls.instructor_id,
      type: "class_created",
      message:
        "Your class was created successfully and is now pending review. We'll notify you once it's published.",
    })
    .catch((err) =>
      logger.error("Failed to notify instructor of new class:", err.message)
    );

  const admins = await userModel.findAdmins();
  const instructor = await userModel.findById(cls.instructor_id);

  const adminMessage = `Instructor ${instructor.full_name} submitted a new class "${cls.title}"${
    cls.start_date ? ` starting ${new Date(cls.start_date).toLocaleDateString("en-US", { dateStyle: "long" })}` : ""
  } that is awaiting your review.`;
  const adminNotificationPromises = admins.map((admin) =>
    notificationService.createNotification({
      user_id: admin.id,
      type: "new_class",
      message: adminMessage,
    })
  );

  const instructorMessage =
    `Your class "${cls.title}" was created successfully and is pending admin approval. It will appear on your dashboard once published.`;

  const sender = admins[0];
  if (sender) {
    messageService
      .createMessage({
        sender_id: sender.id,
        receiver_id: cls.instructor_id,
        message: instructorMessage,
      })
      .catch((err) =>
        logger.error(
          "Failed to send instructor class message:",
          err.message
        )
      );
  }

  const adminMessagePromises = admins.map((admin) =>
    messageService.createMessage({
      sender_id: instructor.id,
      receiver_id: admin.id,
      message: adminMessage,
    })
  );

  sendSuccess(res, cls, "Class created");

  Promise.allSettled(adminNotificationPromises).then((results) => {
    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        logger.error(
          "Failed to notify admin",
          admins[idx].id,
          result.reason?.message || result.reason
        );
      }
    });
  });

  Promise.allSettled(adminMessagePromises).then((results) => {
    results.forEach((result, idx) => {
      if (result.status === "rejected") {
        logger.error(
          "Failed to send admin message",
          admins[idx].id,
          result.reason?.message || result.reason
        );
      }
    });
  });

});

exports.getAllClasses = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await service.getAllClasses({
    page: Number(page),
    limit: Number(limit),
  });
  sendSuccess(res, result.data, undefined, result.meta);
});

exports.getClassById = catchAsync(async (req, res) => {
  const cls = await service.getClassById(req.params.id);
  if (cls) {
    cls.views = await service.getClassViewCount(req.params.id);
  }
  sendSuccess(res, cls);
});

exports.getMyClasses = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await service.getClassesByInstructor(req.user.id, {
    page: Number(page),
    limit: Number(limit),
  });
  sendSuccess(res, result.data, undefined, result.meta);
});

/**
 * Update an existing class
 * - Handles slug regeneration and file cleanup
 * - Updates tags if provided
 * - Sends notifications/messages to both admins and instructor
 */
exports.updateClass = catchAsync(async (req, res) => {
  const existing = await service.getClassById(req.params.id);
  const { tags: rawTags, included_plans, access_type, ...body } = req.body;
  let data = { ...body };
  if (included_plans !== undefined) {
    try {
      data.included_plans = JSON.parse(included_plans);
    } catch {
      data.included_plans = included_plans;
    }
  }
  if (access_type !== undefined) {
    data.access_type = access_type;
  }
  if (data.title && data.title !== existing.title) {
    data.slug = await generateUniqueSlug(data.title);
  }
  if (req.files?.cover_image?.[0]) {
    if (existing?.cover_image) {
      const oldPath = path.join(__dirname, '../../../', existing.cover_image);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.cover_image = `/uploads/classes/${req.files.cover_image[0].filename}`;
  }
  if (req.files?.demo_video?.[0]) {
    if (existing?.demo_video_url) {
      const oldPath = path.join(__dirname, '../../../', existing.demo_video_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    data.demo_video_url = `/uploads/classes/${req.files.demo_video[0].filename}`;
  }
  if (req.user.role === 'instructor') {
    data.instructor_id = existing.instructor_id;
  }
  const tags = rawTags ? JSON.parse(rawTags) : null;
  const cls = await service.updateClass(req.params.id, data);
  if (tags) {
    // remove existing then add
    await db('class_tag_map').where({ class_id: cls.id }).del();
    const tagIds = [];
    for (const name of tags) {
      const existingTag = await tagService.findByName(name);
      const tag =
        existingTag ||
        (await tagService.createTag({
          name,
          slug: slugify(name, { lower: true, strict: true }),
        }));
      tagIds.push(tag.id);
    }
    await service.addClassTags(cls.id, tagIds);
    cls.tags = await service.getClassTags(cls.id);
  }
  if (
    req.user.role !== "instructor" &&
    existing.instructor_id &&
    existing.instructor_id !== req.user.id
  ) {
    await notificationService.createNotification({
      user_id: existing.instructor_id,
      type: "class_updated",
      message: `Your class "${cls.title}" was updated by an admin`,
    });

    const admins = await userModel.findAdmins();
    const instructor = await userModel.findById(existing.instructor_id);

    const adminMessage = `Class "${cls.title}" was updated by ${req.user.full_name}`;
    await Promise.all(
      admins.map((admin) =>
        notificationService.createNotification({
          user_id: admin.id,
          type: "class_updated",
          message: adminMessage,
        })
      )
    );

    const instructorMessage = `Your class "${cls.title}" was updated by an admin.`;
    const sender = admins[0];
    if (sender) {
      await messageService.createMessage({
        sender_id: sender.id,
        receiver_id: instructor.id,
        message: instructorMessage,
      });
    }
    await Promise.all(
      admins.map((admin) =>
        messageService.createMessage({
          sender_id: instructor.id,
          receiver_id: admin.id,
          message: adminMessage,
        })
      )
    );
  }
  sendSuccess(res, cls);
});

exports.deleteClass = catchAsync(async (req, res) => {
  const cls = await service.getClassById(req.params.id);
  await service.deleteClass(req.params.id);
  if (cls) {
    await notificationService.createNotification({
      user_id: cls.instructor_id,
      type: "class_deleted",
      message: `Class "${cls.title}" deleted`,
    });
  }
  sendSuccess(res, null, "Class deleted");
});

exports.getPublishedClasses = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await service.getPublishedClasses({
    page: Number(page),
    limit: Number(limit),
  });
  sendSuccess(res, result.data, undefined, result.meta);
});

exports.getPublicClassDetails = catchAsync(async (req, res) => {
  const cls = await service.getPublicClassDetails(req.params.id);
  if (cls) {
    await service.recordClassView(
      req.params.id,
      req.user?.id,
      req.ip,
      req.headers["user-agent"]
    );
    cls.views = await service.getClassViewCount(req.params.id);
  }
  sendSuccess(res, cls);
});

exports.getClassAnalytics = catchAsync(async (req, res) => {
  const data = await service.getClassAnalytics(req.params.id);
  sendSuccess(res, data);
});

exports.toggleClassStatus = catchAsync(async (req, res) => {
  const cls = await service.togglePublishStatus(req.params.id);
  if (
    req.user.role !== "instructor" &&
    cls.instructor_id &&
    cls.instructor_id !== req.user.id
  ) {
    await notificationService.createNotification({
      user_id: cls.instructor_id,
      type: "class_status_changed",
      message: `An admin changed the status of your class "${cls.title}" to ${cls.status}`,
    });
  }
  sendSuccess(res, cls);
});

exports.approveClass = catchAsync(async (req, res) => {
  const cls = await service.updateModeration(req.params.id, "Approved");
  await notificationService.createNotification({
    user_id: cls.instructor_id,
    type: "class_approved",
    message: `Class "${cls.title}" approved. You can now start teaching`,
  });
  sendSuccess(res, cls, "Class approved");
});

exports.rejectClass = catchAsync(async (req, res) => {
  const cls = await service.updateModeration(
    req.params.id,
    "Rejected",
    req.body.reason
  );
  if (
    req.user.role !== "instructor" &&
    cls.instructor_id &&
    cls.instructor_id !== req.user.id
  ) {
    await notificationService.createNotification({
      user_id: cls.instructor_id,
      type: "class_rejected",
      message: `Your class "${cls.title}" was rejected${
        req.body.reason ? `: ${req.body.reason}` : ""
      }`,
    });
  }
  sendSuccess(res, { message: "Class rejected" });
});

exports.getManagementData = catchAsync(async (req, res) => {
  const classId = req.params.id;
  const cls = await service.getClassById(classId);
  const lessons = await require("./lessons/classLesson.service").getByClass(
    classId
  );
  const assignments = await require("./assignments/classAssignment.service").getByClass(
    classId
  );
  sendSuccess(res, { class: cls, lessons, assignments });
});
