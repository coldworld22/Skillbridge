const { parsePlanFeatures } = require("../../utils/planFeatures");

/**
 * Preset advertisement feature rules per instructor plan tier.
 * These serve as sane defaults when explicit plan features are
 * not configured in the database.
 */
const AD_PLAN_RULES = {
  basic: {
    ads_max_ads: 3,
    ads_max_duration: 3,
    ads_allow_branding: false,
    ads_show_analytics: false,
  },
  "basic-plan": {
    ads_max_ads: 3,
    ads_max_duration: 3,
    ads_allow_branding: false,
    ads_show_analytics: false,
  },
  regular: {
    ads_max_ads: 5,
    ads_max_duration: 14,
    ads_allow_branding: true,
    ads_show_analytics: true,
  },
  "regular-plan": {
    ads_max_ads: 5,
    ads_max_duration: 14,
    ads_allow_branding: true,
    ads_show_analytics: true,
  },
  prime: {
    ads_max_ads: 15,
    ads_max_duration: 30,
    ads_allow_branding: true,
    ads_show_analytics: true,
  },
  "prime-plan": {
    ads_max_ads: 15,
    ads_max_duration: 30,
    ads_allow_branding: true,
    ads_show_analytics: true,
  },
  "instructor-basic": {
    ads_max_ads: 3,
    ads_max_duration: 3,
    ads_allow_branding: false,
    ads_show_analytics: false,
  },
  "instructor-regular": {
    ads_max_ads: 5,
    ads_max_duration: 14,
    ads_allow_branding: true,
    ads_show_analytics: true,
  },
  "instructor-prime": {
    ads_max_ads: 15,
    ads_max_duration: 30,
    ads_allow_branding: true,
    ads_show_analytics: true,
  },
  "instructor-pro": {
    ads_max_ads: 15,
    ads_max_duration: 30,
    ads_allow_branding: true,
    ads_show_analytics: true,
  },
};

const normalizePlanKey = (plan) => {
  if (!plan) return null;
  if (plan.slug) return String(plan.slug).toLowerCase();
  if (plan.name) {
    return String(plan.name)
      .toLowerCase()
      .replace(/\s+/g, "-");
  }
  return null;
};

/**
 * Return advertisement-related capabilities for a plan by merging any
 * configured plan features with sensible defaults for known plan tiers.
 */
const resolveAdPlanFeatures = (plan) => {
  const features = parsePlanFeatures(plan);
  const key = normalizePlanKey(plan);
  const defaults = key && AD_PLAN_RULES[key] ? AD_PLAN_RULES[key] : {};
  return { ...defaults, ...features };
};

// Safely calculate click-through rate as a percentage.
// Returns 0 if views is not a positive number to avoid division errors.
const calculateCtr = (clicks, views) => {
  const c = Number(clicks);
  const v = Number(views);
  if (!Number.isFinite(c) || !Number.isFinite(v) || v <= 0) return 0;
  return (c / v) * 100;
};

module.exports = {
  AD_PLAN_RULES,
  parsePlanFeatures,
  resolveAdPlanFeatures,
  calculateCtr,
  normalizePlanKey,
};
