const db = require("../../../config/database");
const { calculatePlatformFee } = require("./platformFee");
const { parsePlanFeatures } = require("../../../utils/planFeatures");

// Calculate instructor share for a subscription-covered enrollment
// Uses plan usage metrics and the plan's commission rate to determine the
// instructor's payout for the given plan and item.
exports.calculateInstructorAmount = async (
  planId,
  itemId,
  trx,
  itemType = "class",
  options = {}
) => {
  const { incrementUsage = true } = options || {};
  const query = trx || db;
  try {
    let usageQuery = query("plan_usage_metrics").where({
      plan_id: planId,
      item_type: itemType,
      item_id: itemId,
    });

    if (trx && typeof usageQuery.forUpdate === "function") {
      usageQuery = usageQuery.forUpdate();
    }

    let row = await usageQuery.first();

    if (!row) {
      if (incrementUsage) {
        await query("plan_usage_metrics").insert({
          plan_id: planId,
          item_type: itemType,
          item_id: itemId,
          usage_count: 0,
          instructor_amount: 0,
        });
      }
      row = { usage_count: 0, instructor_amount: 0 };
    }

    const plan = await query("plans").where({ id: planId }).first();

    const featureRows = plan
      ? await query("plan_features")
          .where({ plan_id: planId })
          .select("feature_key", "value")
      : [];
    const features = parsePlanFeatures({ features: featureRows });

    const price = Number(plan?.price_monthly || 0);
    let net = 0;
    if (plan) {
      if (features.commission_rate != null) {
        const commissionRate = Number(features.commission_rate);
        net = price - price * commissionRate;
      } else {
        ({ instructor_amount: net } = await calculatePlatformFee(itemType, price));
      }
    }

    const roundCurrency = (value) =>
      Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;

    const previousTotal = roundCurrency(Number(row.instructor_amount || 0));
    const targetTotal = roundCurrency(net);
    const delta = targetTotal > previousTotal ? targetTotal - previousTotal : 0;
    if (incrementUsage) {
      const newTotal = roundCurrency(previousTotal + delta);
      await query("plan_usage_metrics")
        .where({ plan_id: planId, item_type: itemType, item_id: itemId })
        .update({
          usage_count: Number(row.usage_count || 0) + 1,
          instructor_amount: newTotal,
        });
    }

    return roundCurrency(delta);
  } catch (err) {
    // If metrics table missing or query fails, do not block enrollment
    return 0;
  }
};
