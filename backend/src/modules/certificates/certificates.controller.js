/**
 * Certificate admin controller
 */
const PDFDocument = require("pdfkit");
const service = require("./certificates.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");

const sanitize = (value) => value?.replace?.(/[^\w.-]+/g, "") || "certificate";

const ensureCertificate = async (id) => {
  const certificate = await service.getById(id);
  if (!certificate) {
    throw new AppError("Certificate not found", 404);
  }
  return certificate;
};

/**
 * List all certificates
 */
exports.list = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const certificates = await service.getAll({ page, limit });
  sendSuccess(res, certificates);
});

/**
 * Get single certificate
 */
exports.getOne = catchAsync(async (req, res) => {
  const certificate = await ensureCertificate(req.params.id);
  sendSuccess(res, certificate);
});

/**
 * Approve certificate
 */
exports.approve = catchAsync(async (req, res) => {
  const certificate = await service.updateStatus(req.params.id, "issued", {
    reason: null,
    revoked_at: null,
  });
  if (!certificate) throw new AppError("Certificate not found", 404);
  sendSuccess(res, certificate, "Certificate approved");
});

/**
 * Reject / revoke certificate
 */
exports.reject = catchAsync(async (req, res) => {
  const reason = req.body?.reason?.trim() || null;
  const certificate = await service.updateStatus(req.params.id, "revoked", {
    reason,
    revoked_at: new Date().toISOString(),
  });
  if (!certificate) throw new AppError("Certificate not found", 404);
  sendSuccess(res, certificate, "Certificate revoked");
});

/**
 * Download certificate snapshot as PDF
 */
exports.download = catchAsync(async (req, res) => {
  const cert = await ensureCertificate(req.params.id);
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const code =
    cert.certificateCode ||
    cert.id ||
    `certificate-${Date.now()}`;
  const safeCode = sanitize(code);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="certificate-${safeCode}.pdf"`
  );

  doc.pipe(res);

  doc
    .fontSize(28)
    .text(`${cert.platformName || "SkillBridge"} Certificate`, {
      align: "center",
    })
    .moveDown(2);

  doc
    .fontSize(18)
    .text(`Awarded to ${cert.studentName}`, {
      align: "center",
    })
    .moveDown(1.5);

  const courseTitle = cert.className || cert.courseTitle || "Course";

  doc
    .fontSize(14)
    .text(`For completing "${courseTitle}"`, { align: "center" })
    .moveDown(1);

  if (cert.grade) {
    doc
      .fontSize(12)
      .text(`Final Grade: ${cert.grade}`, { align: "center" })
      .moveDown(1);
  }

  const issuedOn = cert.issueDate
    ? new Date(cert.issueDate)
    : new Date();

  doc
    .fontSize(12)
    .text(`Issued on ${issuedOn.toLocaleDateString()}`, {
      align: "center",
    })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .text(`Certificate Code: ${code}`, { align: "center" })
    .moveDown(1);

  if (cert.instructorName) {
    doc
      .fontSize(12)
      .text(`Instructor: ${cert.instructorName}`, { align: "center" })
      .moveDown(1);
  }

  if (cert.verificationUrl) {
    doc
      .fontSize(10)
      .fillColor("#1d4ed8")
      .text(cert.verificationUrl, {
        align: "center",
        link: cert.verificationUrl,
        underline: true,
      })
      .fillColor("#000000");
  }

  doc.end();
});
