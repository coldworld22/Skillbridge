const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./plans.service");
const slugify = require("slugify");
const notificationService = require("../notifications/notifications.service");
const userModel = require("../users/user.model");

exports.createPlan = catchAsync(async (req, res) => {
  const {
    name,
    slug,
    price_monthly,
    price_yearly,
    currency = "USD",
    recommended = false,
    active = true,
    color = '#1F2937',
    style = null,
    features = [],
    target_role = 'student',
  } = req.body;

  if (!name) throw new AppError("Name is required", 400);

  const isHex = (val) => /^#([0-9A-F]{3}){1,2}$/i.test(val);
  if (color && !isHex(color)) throw new AppError("Invalid color format", 400);
  if (style) {
    try {
      const conf = JSON.parse(style);
      if (conf.textColor && !isHex(conf.textColor))
        throw new Error("Invalid text color");
      if (conf.gradientStart && !isHex(conf.gradientStart))
        throw new Error("Invalid gradient start color");
      if (conf.gradientEnd && !isHex(conf.gradientEnd))
        throw new Error("Invalid gradient end color");
      if (conf.buttonColor && !isHex(conf.buttonColor))
        throw new Error("Invalid button color");
      if (conf.buttonTextColor && !isHex(conf.buttonTextColor))
        throw new Error("Invalid button text color");
    } catch (err) {
      throw new AppError("Invalid style format", 400);
    }
  }

  const planSlug = slug || slugify(name, { lower: true, strict: true });
  const exists = await service.findBySlug(planSlug);
  if (exists) throw new AppError("Plan slug already exists", 409);
  if (!['student', 'instructor'].includes(target_role))
    throw new AppError('Invalid target role', 400);

  const plan = await service.createPlan({
    name,
    slug: planSlug,
    price_monthly: price_monthly || 0,
    price_yearly: price_yearly || 0,
    currency,
    recommended,
    active,
    color,
    style,
    target_role,
  });

  await service.setFeatures(plan.id, Array.isArray(features) ? features : []);
  const full = await service.getPlanById(plan.id);
  await notificationService.createNotification({
    user_id: req.user.id,
    type: "plan_created",
    message: `Plan "${full.name}" created successfully`,
  });
  const admins = await userModel.findAdmins();
  await Promise.all(
    admins.map((admin) =>
      notificationService.createNotification({
        user_id: admin.id,
        type: "plan_created",
        message: `New plan "${full.name}" created by ${req.user.id}`,
      })
    )
  );
  sendSuccess(res, full, "Plan created");
});

exports.getPlans = catchAsync(async (req, res) => {
  const { role } = req.query;
  const plans = await service.getPlans(role);
  sendSuccess(res, plans);
});

exports.getPlan = catchAsync(async (req, res) => {
  const plan = await service.getPlanById(req.params.id);
  if (!plan) throw new AppError("Plan not found", 404);
  sendSuccess(res, plan);
});

exports.updatePlan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    slug,
    price_monthly,
    price_yearly,
    currency,
    recommended,
    active,
    color,
    style,
    features,
    target_role,
  } = req.body;

  const isHex = (val) => /^#([0-9A-F]{3}){1,2}$/i.test(val);

  if (color && !isHex(color)) throw new AppError("Invalid color format", 400);
  if (style) {
    try {
      const conf = JSON.parse(style);
      if (conf.textColor && !isHex(conf.textColor))
        throw new Error("Invalid text color");
      if (conf.gradientStart && !isHex(conf.gradientStart))
        throw new Error("Invalid gradient start color");
      if (conf.gradientEnd && !isHex(conf.gradientEnd))
        throw new Error("Invalid gradient end color");
      if (conf.buttonColor && !isHex(conf.buttonColor))
        throw new Error("Invalid button color");
      if (conf.buttonTextColor && !isHex(conf.buttonTextColor))
        throw new Error("Invalid button text color");
    } catch (err) {
      throw new AppError("Invalid style format", 400);
    }
  }

  const updates = {};
  if (name) updates.name = name;
  if (price_monthly !== undefined) updates.price_monthly = price_monthly;
  if (price_yearly !== undefined) updates.price_yearly = price_yearly;
  if (currency) updates.currency = currency;
  if (recommended !== undefined) updates.recommended = recommended;
  if (active !== undefined) updates.active = active;
  if (color !== undefined) updates.color = color;
  if (style !== undefined) updates.style = style;
  if (target_role !== undefined) {
    if (!['student', 'instructor'].includes(target_role))
      throw new AppError('Invalid target role', 400);
    updates.target_role = target_role;
  }

  if (slug || name) {
    const planSlug = slug || slugify(name, { lower: true, strict: true });
    const existing = await service.findBySlug(planSlug);
    if (existing && existing.id != id) throw new AppError("Plan slug already exists", 409);
    updates.slug = planSlug;
  }

  const updated = await service.updatePlan(id, updates);
  if (!updated) throw new AppError("Plan not found", 404);

  if (features) await service.setFeatures(id, Array.isArray(features) ? features : []);
  const full = await service.getPlanById(id);
  sendSuccess(res, full, "Plan updated");
});

exports.deletePlan = catchAsync(async (req, res) => {
  const count = await service.deletePlan(req.params.id);
  if (!count) throw new AppError("Plan not found", 404);
  sendSuccess(res, null, "Plan deleted");
});
