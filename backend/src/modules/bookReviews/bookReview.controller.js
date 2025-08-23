const service = require("./bookReview.service");
const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const AppError = require("../../utils/AppError");

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
  const review = await service.updateReview(req.params.id, req.body);
  if (!review) throw new AppError("Review not found", 404);
  sendSuccess(res, review, "Review updated");
});

exports.deleteReview = catchAsync(async (req, res) => {
  await service.deleteReview(req.params.id);
  sendSuccess(res, null, "Review deleted");
});
