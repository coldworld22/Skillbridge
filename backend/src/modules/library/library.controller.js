const service = require("./library.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const path = require("path");
const fs = require("fs");
const planService = require("../plans/plans.service");
const { parsePlanFeatures } = require("../../utils/planFeatures");

exports.listLibrary = catchAsync(async (req, res) => {
  const items = await service.listForStudent(req.user.id);
  sendSuccess(res, items);
});

exports.downloadBook = catchAsync(async (req, res) => {
  const planId =
    req.user.plan_id || req.user.plan?.id || req.user.subscription?.plan_id;
  const plan = planId ? await planService.getPlanById(planId) : null;
  const features = parsePlanFeatures(plan);
  if (!features["books_download"]) {
    return res.status(403).json({ message: "Access denied" });
  }
  const { bookId } = req.params;
  const book = await service.getBookForDownload(req.user.id, bookId);
  if (!book) {
    return res.status(403).json({ message: "Access denied" });
  }
  const filePath = path.join(
    __dirname,
    "../../../uploads",
    path.basename(book.pdf_url)
  );
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${(book.title || "book").replace(/"/g, '')}.pdf"`
  );
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});
