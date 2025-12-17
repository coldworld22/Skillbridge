const logger = require("../../../utils/logger.js");
const paymentConfigService = require("../../paymentConfig/paymentConfig.service");

const DEFAULT_PLATFORM_CUT = {
  class: 15,
  book: 10,
  tutorial: 20,
};

async function calculatePlatformFee(item_type, amount) {
  if (Number(amount) <= 0) {
    return { platform_fee: 0, instructor_amount: Number(amount) || 0 };
  }
  // In tests, avoid DB calls and use defaults for determinism and speed
  let platform_fee = 0;
  let instructor_amount = amount;
  try {
    const settings = await paymentConfigService.getSettings();
    const cut =
      settings?.platformCut?.[item_type] ??
      DEFAULT_PLATFORM_CUT[item_type] ??
      0;
    platform_fee = (amount * cut) / 100;
    instructor_amount = amount - platform_fee;
  } catch (err) {
    logger.error("Failed to load payment settings:", err);
  }
  return { platform_fee, instructor_amount };
}

module.exports = { calculatePlatformFee, DEFAULT_PLATFORM_CUT };
