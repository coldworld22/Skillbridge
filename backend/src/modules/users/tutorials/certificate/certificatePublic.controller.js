const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const AppError = require("../../../../utils/AppError");
const {
  TEMPLATE_SELECT_FIELDS,
  applyTemplateJoin,
  formatCertificateRow,
} = require("../../../certificates/certificate.utils");

exports.verifyByCode = catchAsync(async (req, res) => {
  const { code } = req.params;

  const query = db("certificates")
    .leftJoin("users", "users.id", "certificates.user_id")
    .leftJoin("tutorials", "tutorials.id", "certificates.tutorial_id");

  applyTemplateJoin(query);

  const cert = await query
    .select(
      "certificates.*",
      "users.full_name as user_name",
      "tutorials.title as tutorial_title",
      ...TEMPLATE_SELECT_FIELDS
    )
    .where("certificates.certificate_code", code)
    .first();

  if (!cert) throw new AppError("Certificate not found", 404);

  sendSuccess(res, formatCertificateRow(cert), "Certificate verified");
});
