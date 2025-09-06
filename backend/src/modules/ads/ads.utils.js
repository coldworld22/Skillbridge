const { parsePlanFeatures } = require("../../utils/planFeatures");

// Safely calculate click-through rate as a percentage.
// Returns 0 if views is not a positive number to avoid division errors.
const calculateCtr = (clicks, views) => {
  const c = Number(clicks);
  const v = Number(views);
  if (!Number.isFinite(c) || !Number.isFinite(v) || v <= 0) return 0;
  return (c / v) * 100;
};

module.exports = { parsePlanFeatures, calculateCtr };
