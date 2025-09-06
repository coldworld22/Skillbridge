const db = require("../../../config/database");

// Calculate instructor share for a class enrollment covered by a subscription plan
// Uses plan usage metrics and the plan's commission rate to determine the
// instructor's payout for the given plan and class.
exports.calculateInstructorAmount = async (planId, classId, trx) => {
  const query = trx || db;
  try {
    const row = await query("plan_usage_metrics")
      .where({ plan_id: planId, item_type: "class", item_id: classId })
      .first();
    if (!row) return 0;

    const feature = await query("plan_features")
      .where({ plan_id: planId, feature_key: "commission_rate" })
      .first();

    const rate = feature ? Number(feature.value) : 0;
    const amount = Number(row.amount || row.instructor_amount || 0);
    return amount * (1 - rate);
  } catch (err) {
    // If metrics table missing or query fails, do not block enrollment
    return 0;
  }
};
