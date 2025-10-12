const service = require("./library.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const fs = require("fs");
const planService = require("../plans/plans.service");
const { parsePlanFeatures } = require("../../utils/planFeatures");
const {
  resolveUploadFilePath,
  buildDownloadFilename,
} = require("../../utils/uploads");

exports.listLibrary = catchAsync(async (req, res) => {
  const items = await service.listForStudent(req.user.id);
  sendSuccess(res, items);
});

exports.downloadBook = catchAsync(async (req, res) => {
  const { bookId } = req.params;
  // Grant download if the student has purchased (or has been granted access via subscription)
  const book = await service.getBookForDownload(req.user.id, bookId);
  if (!book) {
    // No purchase record found: deny access
    return res.status(403).json({ message: "Access denied" });
  }

  const filePath = resolveUploadFilePath(book.pdf_url);
  if (!filePath) {
    return res.status(404).json({ message: "File not found" });
  }

  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
  } catch {
    return res.status(404).json({ message: "File not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${buildDownloadFilename(book.title)}"`
  );

  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    res.status(500).end();
  });
  stream.pipe(res);
});
