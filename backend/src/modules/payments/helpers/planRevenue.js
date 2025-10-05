const db = require("../../../config/database");
const { calculatePlatformFee } = require("./platformFee");
const { parsePlanFeatures } = require("../../../utils/planFeatures");

// Calculate instructor share for a subscription-covered enrollment
// Uses plan usage metrics and the plan's commission rate to determine the
// instructor's payout for the given plan and item.
const FALLBACK_SUBSCRIPTION_ID = "00000000-0000-0000-0000-000000000000";

exports.calculateInstructorAmount = async (
  planId,
  subscriptionId,
  itemId,
  trx,
  itemType = "class",
  options = {}
) => {
  const { incrementUsage = true, precomputedAmount } = options || {};
  const query = trx || db;
  try {
    const key = {
      plan_id: planId,
      subscription_id: subscriptionId || FALLBACK_SUBSCRIPTION_ID,
      item_type: itemType,
      item_id: itemId,
    };

    let usageQuery = query("plan_usage_metrics").where(key);

    if (trx && typeof usageQuery.forUpdate === "function") {
      usageQuery = usageQuery.forUpdate();
    }

    let row = await usageQuery.first();

    if (!row) {
      await query("plan_usage_metrics").insert({
        ...key,
        usage_count: 0,
        instructor_amount: 0,
      });
      row = { usage_count: 0, instructor_amount: 0 };
    }

    const plan = await query("plans").where({ id: planId }).first();

    const featureRows = plan
      ? await query("plan_features")
          .where({ plan_id: planId })
          .select("feature_key", "value")
      : [];
    const features = parsePlanFeatures({ features: featureRows });

    const roundCurrency = (value) =>
      Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
    let payout;
    if (precomputedAmount != null) {
      payout = roundCurrency(precomputedAmount);
    } else {
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
      payout = roundCurrency(net);
    }

    const usageCountIncrement = incrementUsage ? 1 : 0;
    const newTotal = roundCurrency(Number(row.instructor_amount || 0) + payout);

    await query("plan_usage_metrics")
      .where(key)
      .update({
        usage_count: Number(row.usage_count || 0) + usageCountIncrement,
        instructor_amount: newTotal,
      });

    return payout;
  } catch (err) {
    // If metrics table missing or query fails, do not block enrollment
    return 0;
  }
};
