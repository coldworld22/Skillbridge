const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./coupons.service");
const { v4: uuidv4 } = require("uuid");

exports.createCoupon = catchAsync(async (req, res) => {
  const data = {
    id: uuidv4(),
    code: req.body.code,
    discount_percent: req.body.discount_percent,
    starts_at: req.body.starts_at || null,
    expires_at: req.body.expires_at || null,
    usage_limit: req.body.usage_limit || null,
    applies_to: req.body.applies_to || null,
    applies_to_id: req.body.applies_to_id || null,
    instructor_id: req.user?.role === "instructor" ? req.user.id : req.body.instructor_id || null,
  };
  const coupon = await service.createCoupon(data);
  sendSuccess(res, coupon, "Coupon created");
});

exports.getCoupons = catchAsync(async (_req, res) => {
  const coupons = await service.getCoupons();
  sendSuccess(res, coupons);
});

exports.getCoupon = catchAsync(async (req, res) => {
  const coupon = await service.getCouponById(req.params.id);
  if (!coupon) throw new AppError("Coupon not found", 404);
  sendSuccess(res, coupon);
});

exports.updateCoupon = catchAsync(async (req, res) => {
  const coupon = await service.updateCoupon(req.params.id, req.body);
  if (!coupon) throw new AppError("Coupon not found", 404);
  sendSuccess(res, coupon, "Coupon updated");
});

exports.deleteCoupon = catchAsync(async (req, res) => {
  await service.deleteCoupon(req.params.id);
  sendSuccess(res, null, "Coupon deleted");
});

exports.validateCode = catchAsync(async (req, res) => {
  const { code, item_type, item_id } = req.params;
  const coupon = await service.findByCode(code);
  if (!coupon) throw new AppError("Invalid coupon", 404);
  if (item_type && coupon.applies_to && coupon.applies_to !== item_type) {
    throw new AppError("Coupon not valid for this item type", 400);
  }
  if (item_id && coupon.applies_to_id && coupon.applies_to_id !== item_id) {
    throw new AppError("Coupon not valid for this item", 400);
  }
  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    throw new AppError("Coupon not active", 400);
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new AppError("Coupon expired", 400);
  }
  if (
    coupon.usage_limit !== null &&
    coupon.times_used >= coupon.usage_limit
  ) {
    throw new AppError("Coupon usage limit reached", 400);
  }
  sendSuccess(res, coupon, "Coupon valid");
});
