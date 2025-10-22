const service = require("./library.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const fs = require("fs");
const path = require("path");
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
  const book = await service.getBookForDownload(bookId, req.user.id);
  if (!book) {
    // No purchase record found: deny access
    return res.status(403).json({ message: "Access denied" });
  }

  let filePath = resolveUploadFilePath(book.pdf_url);
  if (!filePath) {
    const directPath = book.pdf_url
      ? path.join(process.cwd(), book.pdf_url.replace(/^\/+/, ""))
      : null;
    if (directPath && (await fs.promises
      .access(directPath)
      .then(() => true)
      .catch(() => false))) {
      filePath = directPath;
    } else if (book.pdf_url) {
      const normalized = book.pdf_url.replace(/^\/+/, "");
      const candidatePaths = [
        path.join(process.cwd(), "tests", normalized),
        path.join(process.cwd(), "tests", "uploads", normalized),
      ];
      for (const candidate of candidatePaths) {
        // eslint-disable-next-line no-await-in-loop
        const exists = await fs.promises
          .access(candidate)
          .then(() => true)
          .catch(() => false);
        if (exists) {
          filePath = candidate;
          break;
        }
      }
    }
  }
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
