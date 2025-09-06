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

module.exports = { parsePlanFeatures };
