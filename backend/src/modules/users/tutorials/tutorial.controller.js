// 📁 src/modules/users/tutorials/tutorial.controller.js
const path = require("path");
const fs = require("fs");
const db = require("../../../config/database"); // ✅ Required for slug check
const service = require("./tutorial.service");
const { sendSuccess } = require("../../../utils/response");
const slugify = require("slugify");

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

exports.createTutorial = async (req, res) => {
  const data = req.body;

  // 🔄 Handle uploads
  if (req.files?.thumbnail) {
    data.cover_image = `/uploads/tutorials/${req.files.thumbnail[0].filename}`;
  }
  if (req.files?.preview) {
    data.preview_video = `/uploads/tutorials/${req.files.preview[0].filename}`;
  }

  // 🔐 Auto-fill instructor_id from auth if not in body
  if (!data.instructor_id && req.user?.id) {
    data.instructor_id = req.user.id;
  }

  // ✅ Add unique slug
  if (!data.slug && data.title) {
    data.slug = await generateUniqueSlug(data.title);
  }

  const tutorial = await service.createTutorial(data);
  sendSuccess(res, tutorial);
};

exports.getAllTutorials = async (req, res) => {
  const tutorials = await service.getAllTutorials(req.query);
  sendSuccess(res, tutorials);
};

exports.getTutorialById = async (req, res) => {
  const tutorial = await service.getTutorialById(req.params.id);
  sendSuccess(res, tutorial);
};

exports.updateTutorial = async (req, res) => {
  const data = req.body;
  if (req.files?.thumbnail) {
    data.cover_image = `/uploads/tutorials/${req.files.thumbnail[0].filename}`;
  }
  if (req.files?.preview) {
    data.preview_video = `/uploads/tutorials/${req.files.preview[0].filename}`;
  }
  const tutorial = await service.updateTutorial(req.params.id, data);
  sendSuccess(res, tutorial);
};

exports.softDeleteTutorial = async (req, res) => {
  await service.updateStatus(req.params.id, { status: "archived" });
  sendSuccess(res, { message: "Archived" });
};

exports.restoreTutorial = async (req, res) => {
  await service.updateStatus(req.params.id, { status: "draft" });
  sendSuccess(res, { message: "Restored to draft" });
};

exports.permanentlyDeleteTutorial = async (req, res) => {
  await service.permanentlyDeleteTutorial(req.params.id);
  sendSuccess(res, { message: "Permanently deleted" });
};

exports.togglePublishStatus = async (req, res) => {
  await service.togglePublishStatus(req.params.id);
  sendSuccess(res, { message: "Status toggled" });
};

exports.approveTutorial = async (req, res) => {
  await service.updateModeration(req.params.id, "approved");
  sendSuccess(res, { message: "Tutorial approved" });
};

exports.rejectTutorial = async (req, res) => {
  await service.updateModeration(req.params.id, "rejected", req.body.reason);
  sendSuccess(res, { message: "Tutorial rejected" });
};

exports.bulkApproveTutorials = async (req, res) => {
  await service.bulkUpdateModeration(req.body.ids, "approved");
  sendSuccess(res, { message: "Bulk approval done" });
};

exports.bulkTrashTutorials = async (req, res) => {
  await service.bulkUpdateStatus(req.body.ids, "archived");
  sendSuccess(res, { message: "Bulk archived" });
};

exports.getFeaturedTutorials = async (req, res) => {
  const featured = await service.getFeaturedTutorials();
  sendSuccess(res, featured);
};

exports.getPublishedTutorials = async (req, res) => {
  const tutorials = await service.getPublishedTutorials(req.query);
  sendSuccess(res, tutorials);
};

exports.getPublicTutorialDetails = async (req, res) => {
  const tutorial = await service.getPublicTutorialDetails(req.params.id);
  sendSuccess(res, tutorial);
};
exports.getTutorialsByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const tutorials = await service.getTutorialsByCategory(categoryId);
  sendSuccess(res, tutorials);
};