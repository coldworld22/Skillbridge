const parseFeatureValue = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (trimmed.length === 0) return '';

  try {
    return JSON.parse(trimmed);
  } catch (_) {
    const lower = trimmed.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;

    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) return numeric;

    return trimmed;
  }
};

const parsePlanFeatures = (plan = {}) => {
  const result = {};
  if (!plan || !Array.isArray(plan.features)) return result;

  plan.features.forEach((feature) => {
    result[feature.feature_key] = parseFeatureValue(feature.value);
  });

  return result;
};

const buildFeatureMap = (features = []) => {
  if (!Array.isArray(features)) return {};

  return features.reduce((acc, feature) => {
    acc[feature.feature_key] = {
      value: parseFeatureValue(feature.value),
      raw: feature.value,
      description: feature.description || null,
    };
    return acc;
  }, {});
};

module.exports = { parsePlanFeatures, parseFeatureValue, buildFeatureMap };
