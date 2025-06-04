// 📁 src/modules/users/tutorials/tutorial.controller.js
const path = require("path");
const fs = require("fs");
const service = require("./tutorial.service");
const { success } = require("../../../utils/response");
const catchAsync = require("../../../utils/catchAsync");

exports.createTutorial = catchAsync(async (req, res) => {
  const data = req.body;
  if (req.files?.thumbnail) {
    data.cover_image = `/uploads/tutorials/${req.files.thumbnail[0].filename}`;
  }
  if (req.files?.preview) {
    data.preview_video = `/uploads/tutorials/${req.files.preview[0].filename}`;
  }
  const tutorial = await service.createTutorial(data);
  success(res, tutorial);
});

exports.getAllTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getAllTutorials(req.query);
  success(res, tutorials);
});

exports.getTutorialById = catchAsync(async (req, res) => {
  const tutorial = await service.getTutorialById(req.params.id);
  success(res, tutorial);
});

exports.updateTutorial = catchAsync(async (req, res) => {
  const data = req.body;
  if (req.files?.thumbnail) {
    data.cover_image = `/uploads/tutorials/${req.files.thumbnail[0].filename}`;
  }
  if (req.files?.preview) {
    data.preview_video = `/uploads/tutorials/${req.files.preview[0].filename}`;
  }
  const tutorial = await service.updateTutorial(req.params.id, data);
  success(res, tutorial);
});

exports.softDeleteTutorial = catchAsync(async (req, res) => {
  await service.updateStatus(req.params.id, { status: "archived" });
  success(res, { message: "Archived" });
});

exports.restoreTutorial = catchAsync(async (req, res) => {
  await service.updateStatus(req.params.id, { status: "draft" });
  success(res, { message: "Restored to draft" });
});

exports.permanentlyDeleteTutorial = catchAsync(async (req, res) => {
  await service.permanentlyDeleteTutorial(req.params.id);
  success(res, { message: "Permanently deleted" });
});

exports.togglePublishStatus = catchAsync(async (req, res) => {
  await service.togglePublishStatus(req.params.id);
  success(res, { message: "Status toggled" });
});

exports.approveTutorial = catchAsync(async (req, res) => {
  await service.updateModeration(req.params.id, "approved");
  success(res, { message: "Tutorial approved" });
});

exports.rejectTutorial = catchAsync(async (req, res) => {
  await service.updateModeration(req.params.id, "rejected", req.body.reason);
  success(res, { message: "Tutorial rejected" });
});

exports.bulkApproveTutorials = catchAsync(async (req, res) => {
  await service.bulkUpdateModeration(req.body.ids, "approved");
  success(res, { message: "Bulk approval done" });
});

exports.bulkTrashTutorials = catchAsync(async (req, res) => {
  await service.bulkUpdateStatus(req.body.ids, "archived");
  success(res, { message: "Bulk archived" });
});

exports.getFeaturedTutorials = catchAsync(async (req, res) => {
  const featured = await service.getFeaturedTutorials();
  success(res, featured);
});

exports.getPublishedTutorials = catchAsync(async (req, res) => {
  const tutorials = await service.getPublishedTutorials(req.query);
  success(res, tutorials);
});

exports.getPublicTutorialDetails = catchAsync(async (req, res) => {
  const tutorial = await service.getPublicTutorialDetails(req.params.id);
  success(res, tutorial);
});

