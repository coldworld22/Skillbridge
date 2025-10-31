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
  subscriptionId = null
) => {
  if (!planId) return 0;
  const normalizedItemId =
    itemId === undefined || itemId === null ? itemId : String(itemId);
  const query = trx || db;

  const usageCriteria = {
    plan_id: planId,
    item_type: itemType,
    item_id: normalizedItemId,
  };
  if (subscriptionId) {
    usageCriteria.subscription_id = subscriptionId;
  }

  try {
    let row = null;
    try {
      row = await query("plan_usage_metrics").where(usageCriteria).first();
    } catch (err) {
      if (subscriptionId) throw err;
      row = null;
    }

    if (subscriptionId && !row) {
      await query("plan_usage_metrics").insert({
        ...usageCriteria,
        usage_count: 1,
        instructor_amount: 0,
      });
      row = { usage_count: 1, instructor_amount: 0 };
    }

    const usageCount = Math.max(Number(row?.usage_count) || 0, 1);
    const previousAmount = Number(row?.instructor_amount) || 0;

    const plan = await query("plans").where({ id: planId }).first();
    if (!plan) return 0;

    const featureRows = await query("plan_features")
      .where({ plan_id: planId })
      .select("feature_key", "value");
    const features = parsePlanFeatures({ features: featureRows });

    const price = Number(plan.price_monthly || 0);
    let net;
    if (features.commission_rate != null) {
      const commissionRate = Number(features.commission_rate);
      net = price - price * commissionRate;
    } else {
      ({ instructor_amount: net } = await calculatePlatformFee(itemType, price));
    }

    const share = usageCount > 0 ? net / usageCount : 0;
    const roundedShare = Number(share.toFixed(2));
    if (roundedShare <= 0) {
      return 0;
    }

    if (subscriptionId) {
      const newTotal = Number((previousAmount + roundedShare).toFixed(2));
      await query("plan_usage_metrics")
        .where(usageCriteria)
        .update({ instructor_amount: newTotal });
    }

    return roundedShare;
  } catch (err) {
    // If metrics table missing or query fails, do not block enrollment
    return 0;
  }
};
