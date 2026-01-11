const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const { normalizeRole, isAdminRole } = require("../../utils/role");
const service = require("./coupons.service");

const normalizeRoles = (user) => {
  const roles = Array.isArray(user?.roles) ? user.roles : user?.role ? [user.role] : [];
  return roles.filter(Boolean).map((role) => normalizeRole(role));
};

const isInstructorUser = (user) => normalizeRoles(user).includes("instructor");
const isAdminUser = (user) => isAdminRole(user?.roles || user?.role);

const sanitizeDateInput = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const sanitizeNullable = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return value;
};

const stripUndefined = (obj) => {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) delete obj[key];
  });
  return obj;
};

const ensureInstructorScope = async (user, payload, existingCoupon = null) => {
  const allowedScopes = ["class", "tutorial"];
  const targetType = payload.applies_to ?? existingCoupon?.applies_to;
  const targetId = payload.applies_to_id ?? existingCoupon?.applies_to_id;

  if (!targetType || !allowedScopes.includes(targetType)) {
    throw new AppError(
      "Instructors can only manage coupons for their own classes or tutorials",
      400
    );
  }
  if (!targetId) {
    throw new AppError("Select the item this coupon applies to", 400);
  }

  const ownsItem = await service.ensureInstructorOwnsItem({
    instructorId: user.id,
    appliesTo: targetType,
    itemId: targetId,
  });
  if (!ownsItem) {
    throw new AppError("You can only manage coupons for your own items", 403);
  }

  payload.applies_to = targetType;
  payload.applies_to_id = targetId;
  payload.instructor_id = user.id;
};

exports.createCoupon = catchAsync(async (req, res) => {
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new AppError("Tenant required", 400);
  const instructor = isInstructorUser(req.user);
  const payload = {
    id: uuidv4(),
    code: req.body.code,
    discount_percent: req.body.discount_percent,
    starts_at: sanitizeDateInput(req.body.starts_at),
    expires_at: sanitizeDateInput(req.body.expires_at),
    usage_limit:
      typeof req.body.usage_limit === "number" ? req.body.usage_limit : null,
    applies_to: req.body.applies_to || null,
    applies_to_id: sanitizeNullable(req.body.applies_to_id),
    instructor_id: instructor
      ? req.user.id
      : sanitizeNullable(req.body.instructor_id),
  };

  if (!instructor && !isAdminUser(req.user)) {
    throw new AppError("Unauthorized to create coupons", 403);
  }

  if (!instructor && payload.usage_limit === null) {
    delete payload.usage_limit;
  }

  if (instructor) {
    await ensureInstructorScope(req.user, payload);
  }

  try {
    const coupon = await service.createCoupon(payload, tenantId);
    sendSuccess(res, coupon, "Coupon created");
  } catch (err) {
    if (err?.code === "23505") {
      throw new AppError("Coupon code already exists", 400);
    }
    throw err;
  }
});

exports.getCoupons = catchAsync(async (req, res) => {
  const instructor = isInstructorUser(req.user);
  const coupons = await service.getCoupons(
    instructor ? { instructorId: req.user.id, tenantId: req.tenant?.id } : { tenantId: req.tenant?.id }
  );
  sendSuccess(res, coupons);
});

exports.getCoupon = catchAsync(async (req, res) => {
  const instructor = isInstructorUser(req.user);
  const coupon = await service.getCouponByIdScoped(req.params.id, {
    instructorId: instructor ? req.user.id : undefined,
    tenantId: req.tenant?.id,
  });
  if (!coupon) throw new AppError("Coupon not found", 404);
  sendSuccess(res, coupon);
});

exports.updateCoupon = catchAsync(async (req, res) => {
  const instructor = isInstructorUser(req.user);
  const scope = instructor
    ? { instructorId: req.user.id, tenantId: req.tenant?.id }
    : { tenantId: req.tenant?.id };
  const existing = await service.getCouponByIdScoped(req.params.id, scope);
  if (!existing) throw new AppError("Coupon not found", 404);

  const payload = {};

  if (Object.prototype.hasOwnProperty.call(req.body, "code")) {
    payload.code = req.body.code;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "discount_percent")) {
    payload.discount_percent = req.body.discount_percent;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "starts_at")) {
    payload.starts_at = sanitizeDateInput(req.body.starts_at);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "expires_at")) {
    payload.expires_at = sanitizeDateInput(req.body.expires_at);
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "usage_limit")) {
    const value = req.body.usage_limit;
    payload.usage_limit =
      value === null || value === "" || typeof value === "undefined"
        ? null
        : value;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "applies_to")) {
    payload.applies_to = req.body.applies_to;
  }
  if (Object.prototype.hasOwnProperty.call(req.body, "applies_to_id")) {
    payload.applies_to_id = sanitizeNullable(req.body.applies_to_id);
  }

  if (!instructor && !isAdminUser(req.user)) {
    throw new AppError("Unauthorized to update coupons", 403);
  }

  if (instructor) {
    await ensureInstructorScope(req.user, payload, existing);
  } else if (
    payload.applies_to_id === null &&
    existing.applies_to_id !== null
  ) {
    // Allow admins to clear target scope explicitly
    payload.applies_to = payload.applies_to ?? existing.applies_to;
  }

  stripUndefined(payload);

  try {
    const coupon = await service.updateCoupon(req.params.id, payload, scope);
    if (!coupon) throw new AppError("Coupon not found", 404);
    sendSuccess(res, coupon, "Coupon updated");
  } catch (err) {
    if (err?.code === "23505") {
      throw new AppError("Coupon code already exists", 400);
    }
    throw err;
  }
});

exports.deleteCoupon = catchAsync(async (req, res) => {
  const instructor = isInstructorUser(req.user);
  const scope = instructor
    ? { instructorId: req.user.id, tenantId: req.tenant?.id }
    : { tenantId: req.tenant?.id };

  const deleted = await service.deleteCoupon(req.params.id, scope);
  if (!deleted) {
    throw new AppError("Coupon not found", 404);
  }
  sendSuccess(res, null, "Coupon deleted");
});

exports.getInstructorTargets = catchAsync(async (req, res) => {
  if (!isInstructorUser(req.user)) {
    throw new AppError("Instructor access only", 403);
  }
  const targets = await service.getInstructorTargets(req.user.id);
  sendSuccess(res, targets);
});

exports.validateCode = catchAsync(async (req, res) => {
  const { code, item_type, item_id } = req.params;
  const tenantId = req.tenant?.id;
  if (!tenantId) throw new AppError("tenant_not_set", 400);
  const coupon = await service.findByCode(code, tenantId);
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
