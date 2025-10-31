const db = require("../../config/database");
const AppError = require("../../utils/AppError");
const { parsePlanFeatures } = require("../../utils/planFeatures");
const { normalizeRole, isAdminRole } = require("../../utils/role");
const planService = require("../plans/plans.service");
const {
  getActiveStudentSubscription,
  getActiveInstructorSubscription,
  getActiveSubscriptionForPlan,
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

const resolvePlanContextForUser = async (user, normalizedRoles) => {
  let planId =
    user.plan_id || user.plan?.id || user.subscription?.plan_id || null;
  let subscriptionId =
    user.subscription?.subscription_id ||
    user.subscription?.id ||
    user.subscription_id ||
    null;

  if (planId && !subscriptionId && user?.id) {
    const active = await getActiveSubscriptionForPlan(user.id, planId);
    if (active) {
      planId = active.plan_id;
      subscriptionId = active.subscription_id;
    }
  }

  if ((!planId || !subscriptionId) && normalizedRoles.includes("instructor")) {
    const sub = await getActiveInstructorSubscription(user.id);
    if (sub) {
      planId = sub.plan_id;
      subscriptionId = sub.subscription_id;
    }
  }

  if ((!planId || !subscriptionId) && normalizedRoles.includes("student")) {
    const sub = await getActiveStudentSubscription(user.id);
    if (sub) {
      planId = sub.plan_id;
      subscriptionId = sub.subscription_id;
    }
  }

  if (!planId || !subscriptionId) {
    return { planId: null, subscriptionId: null };
  }

  return { planId, subscriptionId };
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
  const { planId, subscriptionId } = await resolvePlanContextForUser(
    user,
    normalizedRoles
  );

  if (!planId) {
    return prepareUnlimitedQuota();
  }

  let plan;
  try {
    plan = await planService.getPlanById(planId);
  } catch (err) {
    plan = null;
  }
  if (!plan) {
    return prepareUnlimitedQuota();
  }

  if (subscriptionId) {
    plan.active_subscription_id = subscriptionId;
  }

  const features = parsePlanFeatures(plan);
  const rawLimit = features[featureKey];

  if (
    UNLIMITED_VALUES.has(rawLimit) ||
    (typeof rawLimit === "string" && rawLimit.toLowerCase() === "unlimited")
  ) {
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
    subscriptionId,
    usageType,
    type,
    async consume(trx) {
      const query = trx || db;
      const itemId = String(user.id);
      const usageCriteria = {
        plan_id: planId,
        item_type: usageType,
        item_id: itemId,
      };
      if (subscriptionId) {
        usageCriteria.subscription_id = subscriptionId;
      }

      let builder = query("plan_usage_metrics").where(usageCriteria);
      if (typeof builder.forUpdate === "function") {
        builder = builder.forUpdate();
      }
      let row = null;
      if (typeof builder.first === "function") {
        row = await builder.first();
      }
      const used = Number(row?.usage_count) || 0;
      if (used >= numericLimit) {
        throw new AppError(buildQuotaExceededMessage(type), 403);
      }

      const updater = query("plan_usage_metrics");
      const whereBuilder = updater.where(usageCriteria);

      if (row) {
        if (typeof whereBuilder.update === "function") {
          await whereBuilder.update({ usage_count: used + 1 });
        }
      } else {
        const inserter = query("plan_usage_metrics");
        if (typeof inserter.insert === "function") {
          const payload = {
            plan_id: planId,
            item_type: usageType,
            item_id: itemId,
            usage_count: 1,
          };
          if (subscriptionId) {
            payload.subscription_id = subscriptionId;
          }
          await inserter.insert(payload);
        }
      }

      const remaining = numericLimit - (used + 1);
      return { remaining: remaining < 0 ? 0 : remaining };
    },
  };

  return quota;
};

module.exports = { prepareMessagingQuota };
