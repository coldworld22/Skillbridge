const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/response");
const service = require("./plans.service");
const slugify = require("slugify");

exports.createPlan = catchAsync(async (req, res) => {
  const {
    name,
    slug,
    price_monthly,
    price_yearly,
    currency = "USD",
    recommended = false,
    active = true,
    features = [],
  } = req.body;

  if (!name) throw new AppError("Name is required", 400);

  const planSlug = slug || slugify(name, { lower: true, strict: true });
  const exists = await service.findBySlug(planSlug);
  if (exists) throw new AppError("Plan slug already exists", 409);

  const plan = await service.createPlan({
    name,
    slug: planSlug,
    price_monthly: price_monthly || 0,
    price_yearly: price_yearly || 0,
    currency,
    recommended,
    active,
  });

  await service.setFeatures(plan.id, Array.isArray(features) ? features : []);
  const full = await service.getPlanById(plan.id);
  sendSuccess(res, full, "Plan created");
});

exports.getPlans = catchAsync(async (_req, res) => {
  const plans = await service.getPlans();
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
    features,
  } = req.body;

  const updates = {};
  if (name) updates.name = name;
  if (price_monthly !== undefined) updates.price_monthly = price_monthly;
  if (price_yearly !== undefined) updates.price_yearly = price_yearly;
  if (currency) updates.currency = currency;
  if (recommended !== undefined) updates.recommended = recommended;
  if (active !== undefined) updates.active = active;

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
