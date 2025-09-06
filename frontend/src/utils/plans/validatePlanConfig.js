// utils/plans/validatePlanConfig.js

export function validateRuleType(value) {
  const t = typeof value;
  return t === "boolean" || t === "number";
}

export function validateCategories(categories) {
  if (!categories || typeof categories !== "object") {
    throw new Error("Categories must be provided");
  }
  Object.entries(categories).forEach(([key, cat]) => {
    if (!cat.label) {
      throw new Error(`Category '${key}' is missing label`);
    }
    if (!Array.isArray(cat.rules)) {
      throw new Error(`Category '${key}' rules must be an array`);
    }
  });
  return true;
}

export function validatePlans(plans, categories) {
  if (!plans || typeof plans !== "object") {
    throw new Error("Plans must be provided");
  }
  Object.entries(plans).forEach(([planName, rules]) => {
    Object.entries(rules || {}).forEach(([ruleKey, mapping]) => {
      const [categoryKey, value] = Object.entries(mapping || {})[0] || [];
      if (!categoryKey || !categories[categoryKey]) {
        throw new Error(
          `Rule '${ruleKey}' in plan '${planName}' references unknown category`
        );
      }
      if (!validateRuleType(value)) {
        throw new Error(
          `Rule '${ruleKey}' in plan '${planName}' has invalid type`
        );
      }
    });
  });
  return true;
}

export function validatePlanConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Config is required");
  }
  validateCategories(config.categories);
  validatePlans(config.plans, config.categories);
  return true;
}

