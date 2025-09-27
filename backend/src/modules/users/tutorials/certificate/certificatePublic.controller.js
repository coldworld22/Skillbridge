const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const AppError = require("../../../../utils/AppError");

exports.verifyByCode = catchAsync(async (req, res) => {
  const { code } = req.params;

  const cert = await db("certificates")
    .leftJoin("users", "users.id", "certificates.user_id")
    .leftJoin("tutorials", "tutorials.id", "certificates.tutorial_id")
    .leftJoin("certificate_templates as ct", "ct.id", "certificates.template_id")
    .select(
      "certificates.*",
      "users.full_name as user_name",
      "tutorials.title as tutorial_title",
      db.raw("row_to_json(ct) as template")
    )
    .where("certificates.certificate_code", code)
    .first();

  if (!cert) throw new AppError("Certificate not found", 404);

  sendSuccess(res, cert, "Certificate verified");
});
