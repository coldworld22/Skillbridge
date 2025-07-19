const service = require("./faqs.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");

exports.listFaqs = catchAsync(async (_req, res) => {
  const faqs = await service.list();
  sendSuccess(res, faqs);
});

exports.createFaq = catchAsync(async (req, res) => {
  const faq = await service.create(req.body);
  sendSuccess(res, faq, "FAQ created");
});

exports.updateFaq = catchAsync(async (req, res) => {
  const faq = await service.update(req.params.id, req.body);
  if (!faq) throw new AppError("FAQ not found", 404);
  sendSuccess(res, faq, "FAQ updated");
});

exports.deleteFaq = catchAsync(async (req, res) => {
  await service.remove(req.params.id);
  sendSuccess(res, null, "FAQ deleted");
});
