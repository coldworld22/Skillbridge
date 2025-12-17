const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("../thirdPartyConfig/thirdPartyConfig.service");

const normalizeSlots = (slots) => {
  if (!slots) return [];
  if (Array.isArray(slots)) {
    return slots
      .map((slot) => String(slot || "").trim())
      .filter(Boolean);
  }
  return String(slots)
    .split(/[\n,]+/)
    .map((slot) => slot.trim())
    .filter(Boolean);
};

const buildResponse = (cfg) => {
  if (!cfg) return {};
  const publisherId = (cfg.publisherId || cfg.clientID || "").trim();
  const adSlots = normalizeSlots(cfg.adSlots || cfg.slotID);
  const active = cfg.active !== false;
  const autoAds = cfg.autoAds === "disabled" ? "disabled" : "enabled";

  if (!active || !publisherId) {
    return {};
  }

  return {
    active,
    publisherId,
    adSlots,
    autoAds,
  };
};

exports.getConfig = catchAsync(async (_req, res) => {
  const settings = await service.getSettings();
  const cfg = settings?.googleAdSense;
  sendSuccess(res, buildResponse(cfg));
});
