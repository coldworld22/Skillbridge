const logger = require("../../utils/logger.js");

exports.getCommissionRate = async (itemType, itemId) => {
  try {
    const db = require("../../config/database");
    const planService = require("../plans/plans.service");
    let instructorId;
    if (itemType === "class") {
      const row = await db("online_classes").select("instructor_id").where({ id: itemId }).first();
      instructorId = row?.instructor_id;
    } else if (itemType === "book") {
      const row = await db("books").select("instructor_id").where({ id: itemId }).first();
      instructorId = row?.instructor_id;
    } else if (itemType === "tutorial") {
      const row = await db("tutorials").select("creator_id").where({ id: itemId }).first();
      instructorId = row?.creator_id;
    }
    if (!instructorId) return null;
    const user = await db("users").select("plan_id").where({ id: instructorId }).first();
    if (!user?.plan_id) return null;
    const plan = await planService.getPlanById(user.plan_id);
    const features = {};
    (plan?.features || []).forEach((f) => {
      let val = f.value;
      try {
        val = JSON.parse(f.value);
      } catch {
        if (f.value === "true") val = true;
        else if (f.value === "false") val = false;
        else if (!isNaN(f.value)) val = Number(f.value);
      }
      features[f.feature_key] = val;
    });
    return Number(features["commission_rate"] || 0);
  } catch (err) {
    logger.error("Failed to fetch commission rate", err);
    return null;
  }
};
