const db = require("../../../config/database");
const { calculatePlatformFee } = require("./platformFee");

// Calculate instructor share for a subscription-covered enrollment
// Uses plan usage metrics and the plan's commission rate to determine the
// instructor's payout for the given plan and item.
exports.calculateInstructorAmount = async (
  planId,
  itemId,
  trx,
  itemType = "class"
) => {
  const query = trx || db;
  try {
    let row = await query("plan_usage_metrics")
      .where({ plan_id: planId, item_type: itemType, item_id: itemId })
      .first();

    if (!row) {
      await query("plan_usage_metrics").insert({
        plan_id: planId,
        item_type: itemType,
        item_id: itemId,
        usage_count: 1,
        instructor_amount: 0,
      });
      row = { usage_count: 1 };
    }

    const plan = await query("plans").where({ id: planId }).first();
    if (!plan) return 0;
    const price = Number(plan.price_monthly || 0);
    const { instructor_amount: net } = await calculatePlatformFee(itemType, price);
    const amount = row.usage_count > 0 ? net / row.usage_count : 0;

    await query("plan_usage_metrics")
      .where({ plan_id: planId, item_type: itemType, item_id: itemId })
      .update({ instructor_amount: amount });

    return Number(amount);
  } catch (err) {
    // If metrics table missing or query fails, do not block enrollment
    return 0;
  }
};
