const express = require("express");
const router = express.Router();
const controller = require("./coupons.controller");
const validate = require("../../middleware/validate");
const {
  verifyToken,
  isInstructorOrAdmin,
  isInstructor,
} = require("../../middleware/auth/authMiddleware");
const validator = require("./coupons.validator");
const {
  resolveTenant,
  ensureTenantMembership,
  enforceTenantStatus,
  requireEntitlement,
} = require("../../middleware/tenant");

router.post(
  "/admin",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  validate(validator.create),
  requireEntitlement("coupon.create"),
  controller.createCoupon,
);
router.get(
  "/admin",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  controller.getCoupons,
);
router.get(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructorOrAdmin,
  controller.getCoupon,
);
router.put(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  validate(validator.update),
  requireEntitlement("coupon.update"),
  controller.updateCoupon,
);
router.delete(
  "/admin/:id",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  enforceTenantStatus(),
  isInstructorOrAdmin,
  requireEntitlement("coupon.delete"),
  controller.deleteCoupon,
);
router.get(
  "/instructor/targets",
  verifyToken,
  resolveTenant,
  ensureTenantMembership(),
  isInstructor,
  controller.getInstructorTargets,
);

// Accept optional item type and id parameters for validation
router.get("/code/:code/:item_type?/:item_id?", resolveTenant, controller.validateCode);

module.exports = router;
