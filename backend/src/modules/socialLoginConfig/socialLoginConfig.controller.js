const catchAsync = require("../../utils/catchAsync");
const { sendSuccess } = require("../../utils/response");
const service = require("./socialLoginConfig.service");
const { initStrategies } = require("../../config/passport");

// Determine if the current user has admin-level access
const isAdminRole = (roles = []) => {
  const arr = Array.isArray(roles) ? roles : [roles];
  return arr
    .map((r) => r.toLowerCase().replace(/\s+/g, ""))
    .some((r) => ["admin", "superadmin"].includes(r));
};

// Remove secrets from the returned settings for non-admin requests
const sanitize = (settings, req) => {
  if (isAdminRole(req.user?.roles || req.user?.role)) return settings;
  const cloned = JSON.parse(JSON.stringify(settings || {}));

  if (cloned.providers) {
    for (const key of Object.keys(cloned.providers)) {
      delete cloned.providers[key]?.clientSecret;
    }
  }
  if (cloned.recaptcha) {
    delete cloned.recaptcha.secretKey;
  }
  return cloned;
};

exports.getSettings = catchAsync(async (req, res) => {
  const settings = await service.getSettings();
  sendSuccess(res, sanitize(settings || {}, req));
});

exports.updateSettings = catchAsync(async (req, res) => {
  const settings = await service.updateSettings(req.body);
  try {
    await initStrategies();
  } catch (err) {
    console.error("Failed to reinitialize passport strategies", err);
  }
  sendSuccess(res, sanitize(settings, req), "Settings updated");
});
