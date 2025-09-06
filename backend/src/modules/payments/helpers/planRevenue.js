const db = require("../../../config/database");

// Calculate instructor share for a class enrollment covered by a subscription plan
// Uses plan usage metrics to determine how much revenue should be credited
// to the instructor for the given plan and class.
exports.calculateInstructorAmount = async (planId, classId, trx) => {
  const query = trx || db;
  try {
    const row = await query("plan_usage_metrics")
      .where({ plan_id: planId, item_type: "class", item_id: classId })
      .first();
    if (!row) return 0;
    // assume table stores instructor_amount column representing amount to credit
    return Number(row.instructor_amount || row.amount || 0);
  } catch (err) {
    // If metrics table missing or query fails, do not block enrollment
    return 0;
  }
};
