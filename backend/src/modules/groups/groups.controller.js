const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./groups.service");
const { v4: uuidv4 } = require("uuid");

exports.createGroup = catchAsync(async (req, res) => {
  const { name, description, visibility, requires_approval, cover_image } = req.body;
  const group = await service.createGroup({
    id: uuidv4(),
    creator_id: req.user.id,
    name,
    description,
    visibility: visibility || "public",
    requires_approval: requires_approval || false,
    cover_image,
  });
  await service.addMember(group.id, req.user.id, "admin");
  sendSuccess(res, group, "Group created");
});

exports.listGroups = catchAsync(async (req, res) => {
  const data = await service.listGroups(req.query.search);
  sendSuccess(res, data);
});

exports.getGroup = catchAsync(async (req, res) => {
  const group = await service.getGroupById(req.params.id);
  sendSuccess(res, group);
});

exports.updateGroup = catchAsync(async (req, res) => {
  const updated = await service.updateGroup(req.params.id, req.body);
  sendSuccess(res, updated);
});

exports.deleteGroup = catchAsync(async (req, res) => {
  await service.deleteGroup(req.params.id);
  sendSuccess(res, null, "Deleted");
});

exports.getMyGroups = catchAsync(async (req, res) => {
  const data = await service.getUserGroups(req.user.id);
  sendSuccess(res, data);
});

exports.joinGroup = catchAsync(async (req, res) => {
  const reqRow = await service.requestJoin(req.params.id, req.user.id);
  sendSuccess(res, reqRow, "Request sent");
});

exports.listTags = catchAsync(async (_req, res) => {
  const data = await service.listTags();
  sendSuccess(res, data);
});
