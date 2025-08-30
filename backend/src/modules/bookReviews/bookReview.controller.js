const service = require("./bookReview.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");
const { isAdminRole } = require("../../utils/role");

exports.listReviews = catchAsync(async (req, res) => {
  const data = await service.listReviews(req.params.bookId);
  sendSuccess(res, data);
});

exports.createReview = catchAsync(async (req, res) => {
  const payload = { ...req.body, user_id: req.user?.id };
  await service.ensurePurchased(payload.user_id, payload.book_id);
  const [review] = await service.createReview(payload);
  sendSuccess(res, review, "Review created");
});

exports.updateReview = catchAsync(async (req, res) => {
  const existing = await service.findById(req.params.id);
  if (!existing) throw new AppError("Review not found", 404);
  const isAdmin = isAdminRole(req.user.roles || req.user.role);
  if (existing.user_id !== req.user.id && !isAdmin) {
    throw new AppError("Access denied", 403);
  }
  const review = await service.updateReview(req.params.id, req.body);
  sendSuccess(res, review, "Review updated");
});

exports.deleteReview = catchAsync(async (req, res) => {
  const existing = await service.findById(req.params.id);
  if (!existing) throw new AppError("Review not found", 404);
  const isAdmin = isAdminRole(req.user.roles || req.user.role);
  if (existing.user_id !== req.user.id && !isAdmin) {
    throw new AppError("Access denied", 403);
  }
  await service.deleteReview(req.params.id);
  sendSuccess(res, null, "Review deleted");
});
