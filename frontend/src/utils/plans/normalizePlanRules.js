// utils/plans/normalizePlanRules.js

// Convert flat plan rules to category grouped structure
export function normalizePlanRules(planRules = {}) {
  const grouped = {};
  Object.entries(planRules).forEach(([ruleKey, mapping]) => {
    const [categoryKey, value] = Object.entries(mapping || {})[0] || [];
    if (!categoryKey) return;
    if (!grouped[categoryKey]) grouped[categoryKey] = {};
    grouped[categoryKey][ruleKey] = value;
  });
  return grouped;
}

// Convert category grouped rules back to flat structure
export function denormalizePlanRules(groupedRules = {}) {
  const flat = {};
  Object.entries(groupedRules).forEach(([categoryKey, rules]) => {
    Object.entries(rules || {}).forEach(([ruleKey, value]) => {
      flat[ruleKey] = { [categoryKey]: value };
    });
  });
  return flat;
}

// Infer rule type from a value
export function inferRuleType(value) {
  const type = typeof value;
  if (type === "boolean") return "toggle";
  if (type === "number") return "number";
  return "unknown";
}

// Build rule definitions using categories and sample plan values
export function buildRuleDefinitions(config) {
  const { categories = {}, plans = {} } = config || {};
  const samplePlan = Object.values(plans)[0] || {};
  const definitions = {};

  Object.entries(categories).forEach(([categoryKey, cat]) => {
    definitions[categoryKey] = (cat.rules || []).map((ruleKey) => {
      const sampleValue =
        samplePlan[ruleKey] && samplePlan[ruleKey][categoryKey];
      return {
        key: ruleKey,
        label: ruleKey
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase()),
        type: inferRuleType(sampleValue),
        defaultValue: sampleValue,
      };
    });
  });

  return definitions;
}

