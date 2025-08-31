const parsePlanFeatures = (plan = {}) => {
  const result = {};
  if (!plan || !Array.isArray(plan.features)) return result;

  plan.features.forEach((f) => {
    let val = f.value;
    if (typeof val === 'string') {
      try {
        val = JSON.parse(val);
      } catch {
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(val)) val = Number(val);
      }
    }
    result[f.feature_key] = val;
  });

  return result;
};

// Safely calculate click-through rate as a percentage.
// Returns 0 if views is not a positive number to avoid division errors.
const calculateCtr = (clicks, views) => {
  const c = Number(clicks);
  const v = Number(views);
  if (!Number.isFinite(c) || !Number.isFinite(v) || v <= 0) return 0;
  return (c / v) * 100;
};

module.exports = { parsePlanFeatures, calculateCtr };
