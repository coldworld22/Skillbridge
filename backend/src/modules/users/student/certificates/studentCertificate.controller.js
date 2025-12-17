const db = require("../../../../config/database");
const catchAsync = require("../../../../utils/catchAsync");
const { sendSuccess } = require("../../../../utils/response");
const AppError = require("../../../../utils/AppError");

const baseQuery = () =>
  db("certificates as c")
    .leftJoin("online_classes as cls", "cls.id", "c.class_id")
    .leftJoin("tutorials as tut", "tut.id", "c.tutorial_id")
    .leftJoin(
      "certificate_templates as tmpl",
      "tmpl.id",
      "c.template_id"
    )
    .select(
      "c.id",
      "c.user_id",
      "c.class_id",
      "c.tutorial_id",
      "c.certificate_code",
      "c.status",
      "c.created_at",
      "cls.title as class_title",
      "tut.title as tutorial_title",
      db.raw("to_jsonb(tmpl) as template")
    );

const formatCertificate = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status === "issued" ? "Issued" : "Revoked",
    issueDate: row.created_at,
    courseTitle: row.class_title || row.tutorial_title || "Certificate",
    classId: row.class_id,
    tutorialId: row.tutorial_id,
    certificateCode: row.certificate_code,
    template: row.template,
    verificationUrl: row.certificate_code
      ? `${process.env.FRONTEND_URL?.replace(/\/$/, "") || ""}/certificate/verify/${row.certificate_code}`
      : null,
  };
};

exports.listMine = catchAsync(async (req, res) => {
  const rows = await baseQuery()
    .where("c.user_id", req.user.id)
    .orderBy("c.created_at", "desc");
  sendSuccess(
    res,
    rows.map(formatCertificate)
  );
});

exports.getMine = catchAsync(async (req, res) => {
  const cert = await baseQuery()
    .where("c.user_id", req.user.id)
    .andWhere("c.id", req.params.id)
    .first();
  if (!cert) {
    throw new AppError("Certificate not found", 404);
  }
  sendSuccess(res, formatCertificate(cert));
});
