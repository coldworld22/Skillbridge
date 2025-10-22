const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const { parsePlanFeatures } = require("../../utils/planFeatures");
const { normalizeRole, isAdminRole } = require("../../utils/role");
const planService = require("../plans/plans.service");
const {
  getActiveStudentPlanId,
  getActiveInstructorPlanId,
} = require("../plans/subscription.helper");

const FEATURE_KEYS = {
  email: "messages_email_limit",
  whatsapp: "messages_whatsapp_limit",
  video: "messages_video_limit",
};

const USAGE_TYPES = {
  email: "message_email",
  whatsapp: "message_whatsapp",
  video: "message_video",
};

const UNLIMITED_VALUES = new Set([null, undefined, "", "unlimited"]);

const buildQuotaExceededMessage = (type) => {
  switch (type) {
    case "email":
      return "You have reached the email allowance included in your plan. Please upgrade to continue sending emails.";
    case "whatsapp":
      return "You have reached the WhatsApp allowance included in your plan. Please upgrade to continue sending WhatsApp messages.";
    case "video":
      return "You have reached the video call allowance included in your plan. Please upgrade to continue starting video calls.";
    default:
      return "You have exhausted the quota for this feature. Please upgrade your plan to continue.";
  }
};

const buildMissingPlanMessage = (type) => {
  switch (type) {
    case "email":
      return "A paid subscription is required to send direct emails.";
    case "whatsapp":
      return "A paid subscription is required to send WhatsApp messages.";
    case "video":
      return "A paid subscription is required to start video calls.";
    default:
      return "A paid subscription is required to use this feature.";
  }
};

const resolvePlanIdForUser = async (user, normalizedRoles) => {
  let planId =
    user.plan_id || user.plan?.id || user.subscription?.plan_id || null;

  if (planId) return planId;

  if (normalizedRoles.includes("instructor")) {
    planId = await getActiveInstructorPlanId(user.id);
    if (planId) return planId;
  }

  if (normalizedRoles.includes("student")) {
    planId = await getActiveStudentPlanId(user.id);
    if (planId) return planId;
  }

  return null;
};

const prepareUnlimitedQuota = () => ({
  limit: null,
  unlimited: true,
  async consume() {
    return { remaining: null };
  },
});

const prepareMessagingQuota = async (user, type) => {
  if (!user || !user.id) {
    throw new AppError("Unauthorized", 401);
  }

  const featureKey = FEATURE_KEYS[type];
  const usageType = USAGE_TYPES[type];

  if (!featureKey || !usageType) {
    throw new AppError("Unsupported messaging feature", 400);
  }

  const roles = user.roles && user.roles.length ? user.roles : [user.role];
  if (isAdminRole(roles)) {
    return prepareUnlimitedQuota();
  }

  const normalizedRoles = roles.map((r) => normalizeRole(r));
  const hasRoleInformation = normalizedRoles.some((role) => role);
  if (!hasRoleInformation) {
    return prepareUnlimitedQuota();
  }
  const planId = await resolvePlanIdForUser(user, normalizedRoles);

  if (!planId) {
    return prepareUnlimitedQuota();
  }

  const plan = await planService.getPlanById(planId);
  if (!plan) {
    throw new AppError("Unable to load subscription details. Please contact support.", 500);
  }

  const features = parsePlanFeatures(plan);
  const rawLimit = features[featureKey];

  if (UNLIMITED_VALUES.has(rawLimit) || (typeof rawLimit === "string" && rawLimit.toLowerCase() === "unlimited")) {
    return prepareUnlimitedQuota();
  }

  const numericLimit = Number(rawLimit);
  if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
    return prepareUnlimitedQuota();
  }

  const quota = {
    limit: numericLimit,
    unlimited: false,
    planId,
    usageType,
    type,
    async consume(trx) {
      const query = trx || db;
      const itemId = String(user.id);

      let row = await query("plan_usage_metrics")
        .where({
          plan_id: planId,
          item_type: usageType,
          item_id: itemId,
        })
        .forUpdate()
        .first();

      const used = Number(row?.usage_count) || 0;
      if (used >= numericLimit) {
        throw new AppError(buildQuotaExceededMessage(type), 403);
      }

      if (row) {
        await query("plan_usage_metrics")
          .where({
            plan_id: planId,
            item_type: usageType,
            item_id: itemId,
          })
          .update({ usage_count: used + 1 });
      } else {
        await query("plan_usage_metrics").insert({
          plan_id: planId,
          item_type: usageType,
          item_id: itemId,
          usage_count: 1,
        });
      }

      const remaining = numericLimit - (used + 1);
      return { remaining: remaining < 0 ? 0 : remaining };
    },
  };

  return quota;
};

module.exports = { prepareMessagingQuota };
