const service = require("./roles.service");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");

exports.createRole = catchAsync(async (req, res) => {
  const role = await service.createRole(req.body);
  sendSuccess(res, role, "Role created");
});

exports.getRoles = catchAsync(async (_req, res) => {
  const data = await service.getRoles();
  sendSuccess(res, data);
});

exports.getRole = catchAsync(async (req, res) => {
  const role = await service.getRoleById(req.params.id);
  if (!role) throw new AppError("Role not found", 404);
  sendSuccess(res, role);
});

exports.updateRole = catchAsync(async (req, res) => {
  const role = await service.updateRole(req.params.id, req.body);
  if (!role) throw new AppError("Role not found", 404);
  sendSuccess(res, role, "Role updated");
});

exports.deleteRole = catchAsync(async (req, res) => {
  await service.deleteRole(req.params.id);
  sendSuccess(res, null, "Role deleted");
});

exports.createPermission = catchAsync(async (req, res) => {
  const perm = await service.createPermission(req.body);
  sendSuccess(res, perm, "Permission created");
});

exports.getPermissions = catchAsync(async (_req, res) => {
  const data = await service.getPermissions();
  sendSuccess(res, data);
});

exports.updatePermission = catchAsync(async (req, res) => {
  const perm = await service.updatePermission(req.params.id, req.body);
  if (!perm) throw new AppError("Permission not found", 404);
  sendSuccess(res, perm, "Permission updated");
});

exports.deletePermission = catchAsync(async (req, res) => {
  await service.deletePermission(req.params.id);
  sendSuccess(res, null, "Permission deleted");
});

exports.assignPermissions = catchAsync(async (req, res) => {
  const role = await service.assignPermissions(
    req.params.id,
    req.body.permissionIds || [],
    req.user.id
  );
  sendSuccess(res, role, "Permissions assigned");
});
