const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const service = require("./tenantDomains.service");

exports.list = catchAsync(async (req, res) => {
  const domains = await service.listByTenant(req.tenant.id);
  sendSuccess(res, domains);
});

exports.create = catchAsync(async (req, res) => {
  const { domain } = req.body || {};
  if (!domain) throw new AppError("Domain is required", 400);
  const created = await service.createDomain(req.tenant.id, domain);
  sendSuccess(res, created, "Domain created");
});

exports.verify = catchAsync(async (req, res) => {
  const token = req.body?.token || req.query?.token;
  const verified = await service.verifyDomain(req.params.id, token, req.tenant.id);
  sendSuccess(res, verified, "Domain verified");
});

exports.remove = catchAsync(async (req, res) => {
  await service.deleteDomain(req.params.id, req.tenant.id);
  sendSuccess(res, null, "Domain removed");
});
