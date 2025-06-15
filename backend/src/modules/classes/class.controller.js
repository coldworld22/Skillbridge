const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./class.service");

exports.createClass = catchAsync(async (req, res) => {
  const data = { ...req.body, id: uuidv4() };
  const cls = await service.createClass(data);
  sendSuccess(res, cls, "Class created");
});

exports.getAllClasses = catchAsync(async (_req, res) => {
  const classes = await service.getAllClasses();
  sendSuccess(res, classes);
});

exports.getClassById = catchAsync(async (req, res) => {
  const cls = await service.getClassById(req.params.id);
  sendSuccess(res, cls);
});

exports.updateClass = catchAsync(async (req, res) => {
  const cls = await service.updateClass(req.params.id, req.body);
  sendSuccess(res, cls);
});

exports.deleteClass = catchAsync(async (req, res) => {
  await service.deleteClass(req.params.id);
  sendSuccess(res, null, "Class deleted");
});

exports.getPublishedClasses = catchAsync(async (_req, res) => {
  const classes = await service.getPublishedClasses();
  sendSuccess(res, classes);
});

exports.getPublicClassDetails = catchAsync(async (req, res) => {
  const cls = await service.getPublicClassDetails(req.params.id);
  sendSuccess(res, cls);
});
