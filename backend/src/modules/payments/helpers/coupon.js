const AppError = require("../../../utils/AppError");
const logger = require("../../../utils/logger.js");
const couponService = require("../../coupons/coupons.service");

/**
 * Loads a coupon by ID and ensures it can be applied to the requested item.
 * Returns `null` when no coupon was supplied.
 */
async function loadAndValidateCoupon(couponId, { itemType, itemId, tenantId }) {
  if (!couponId) return null;

  const coupon = await couponService.getCouponById(couponId, tenantId);
  if (!coupon) throw new AppError("Invalid coupon", 400);

  if (coupon.applies_to && coupon.applies_to !== itemType) {
    throw new AppError("Coupon not valid for this item type", 400);
  }

  if (coupon.applies_to_id && coupon.applies_to_id !== itemId) {
    throw new AppError("Coupon not valid for this item", 400);
  }

  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    throw new AppError("Coupon not active", 400);
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    throw new AppError("Coupon expired", 400);
  }

  if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
    throw new AppError("Coupon usage limit reached", 400);
  }

  return coupon;
}

async function markCouponRedeemed(couponId, tenantId = null) {
  if (!couponId) return;
  try {
    await couponService.incrementUsage(couponId, tenantId);
  } catch (err) {
    logger.error("Failed to increment coupon usage:", err);
  }
}

module.exports = { loadAndValidateCoupon, markCouponRedeemed };
