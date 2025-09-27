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
    .leftJoin("tutorials", "tutorials.id", "certificates.tutorial_id")
    .leftJoin(
      "certificate_templates as template",
      "certificates.template_id",
      "template.id",
    )
    .select(
      "certificates.*",
      "users.full_name as user_name",
      "tutorials.title as tutorial_title",
      "template.name as template_name",
      "template.type as template_type",
      "template.font_family as template_font_family",
      "template.title_font as template_title_font",
      "template.border_color as template_border_color",
      "template.logo as template_logo",
      "template.background as template_background",
      "template.show_qr as template_show_qr"
    )
    .where("certificates.certificate_code", code)
    .first();

  if (!cert) throw new AppError("Certificate not found", 404);

  sendSuccess(res, formatCertificateRow(cert), "Certificate verified");
});
