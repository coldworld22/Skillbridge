const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./groups.service");
const { v4: uuidv4 } = require("uuid");
const AppError = require("../../utils/AppError");
const userModel = require("../users/user.model");
const notificationService = require("../notifications/notifications.service");
const messageService = require("../messages/messages.service");

exports.createGroup = catchAsync(async (req, res) => {
  const { name, description, visibility, requires_approval, category_id, max_size, timezone } = req.body;
  if (await service.findByName(name)) {
    throw new AppError("Group name already exists", 409);
  }
  const group = await service.createGroup({
    id: uuidv4(),
    creator_id: req.user.id,
    name,
    description,
    visibility: visibility || "public",
    requires_approval: requires_approval || false,
    cover_image: req.file ? `/uploads/groups/${req.file.filename}` : undefined,
    category_id: category_id || null,
    max_size: max_size || null,
    timezone: timezone || null,
    status: "pending",
  });
  if (req.body.tags) {
    const tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
    await service.syncGroupTags(group.id, tags);
  }
  await service.addMember(group.id, req.user.id, "admin");

  const students = await userModel.findStudents();
  const instructors = await userModel.findInstructors();
  const admins = await userModel.findAdmins();
  const recipients = [...students, ...instructors, ...admins].filter(
    (u) => u.id !== req.user.id
  );
  const message = `${req.user.full_name} created a new group "${name}"`;

  await Promise.all([
    ...recipients.map((u) =>
      notificationService.createNotification({
        user_id: u.id,
        type: "group_created",
        message,
      })
    ),
    ...recipients.map((u) =>
      messageService.createMessage({
        sender_id: req.user.id,
        receiver_id: u.id,
        message,
      })
    ),
  ]);

  const full = await service.getGroupById(group.id);
  sendSuccess(res, full, "Group created");
});

exports.listGroups = catchAsync(async (req, res) => {
  const { search, status = 'all' } = req.query;
  const data = await service.listGroups({ search, status });
  sendSuccess(res, data);
});

exports.getGroup = catchAsync(async (req, res) => {
  const group = await service.getGroupById(req.params.id);
  sendSuccess(res, group);
});

exports.updateGroup = catchAsync(async (req, res) => {
  const data = { ...req.body };
  if (data.status && !['active','inactive','suspended','pending'].includes(data.status)) {
    throw new AppError('Invalid status', 400);
  }
  if (req.file) data.cover_image = `/uploads/groups/${req.file.filename}`;
  const updated = await service.updateGroup(req.params.id, data);
  if (req.body.tags) {
    const tags = Array.isArray(req.body.tags) ? req.body.tags : JSON.parse(req.body.tags);
    await service.syncGroupTags(req.params.id, tags);
  }
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
exports.listMembers = catchAsync(async (req, res) => {
  const members = await service.listMembers(req.params.id);
  sendSuccess(res, members);
});

exports.manageMember = catchAsync(async (req, res) => {
  const { memberId } = req.params;
  const { action } = req.body;
  const result = await service.manageMember(req.params.id, memberId, action);
  sendSuccess(res, result);
});

exports.listJoinRequests = catchAsync(async (req, res) => {
  const requests = await service.listJoinRequests(req.params.id);
  sendSuccess(res, requests);
});

exports.manageJoinRequest = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body;
  if (!['approve', 'reject'].includes(action)) {
    throw new AppError('Invalid action', 400);
  }
  const result = await service.manageJoinRequest(requestId, action);
  sendSuccess(res, result);
});
