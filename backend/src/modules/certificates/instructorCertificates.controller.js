const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./instructorCertificates.service");

const ALLOWED_STATUSES = new Set(["issued", "revoked", "pending"]);

exports.list = catchAsync(async (req, res) => {
  const filters = {
    q: req.query.q?.trim(),
  };
  if (req.query.status && ALLOWED_STATUSES.has(req.query.status)) {
    filters.status = req.query.status;
  }
  const items = await service.listForInstructor(req.user.id, filters);
  sendSuccess(res, items);
});

exports.getOne = catchAsync(async (req, res) => {
  const certificate = await service.getForInstructor(
    req.params.id,
    req.user.id,
  );
  sendSuccess(res, certificate);
});

exports.issue = catchAsync(async (req, res) => {
  const created = await service.issueForInstructor(req.user.id, req.body);
  const certificate = await service.getForInstructor(created.id, req.user.id);
  sendSuccess(res, certificate, "Certificate issued");
});

exports.revoke = catchAsync(async (req, res) => {
  const revoked = await service.revokeForInstructor(
    req.params.id,
    req.user.id,
  );
  sendSuccess(res, revoked, "Certificate revoked");
});
