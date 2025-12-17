const { randomUUID } = require("crypto");
const AppError = require("../../utils/AppError");
const { readJsonSetting, writeJsonSetting } = require("../../utils/settingsStore");

const SETTINGS_KEY = "messages_settings";
const REQUIRED_GATEWAY_FIELDS = ["name", "apiKey", "senderId", "region"];
const REQUIRED_OTP_FIELDS = ["name", "apiKey", "region"];

const generateProviderId = () => {
  if (typeof randomUUID === "function") {
    return randomUUID();
  }
  return `provider-${Date.now()}-${Math.random().toString(16).slice(2, 9)}`;
};

const normalizeProviders = (providers = []) => {
  const seenIds = new Set();
  let dirty = false;
  let activeLocked = false;
  let defaultLocked = false;
  let otpIncluded = false;

  const normalized = [];

  providers.forEach((provider) => {
    if (!provider || typeof provider !== "object") {
      dirty = true;
      return;
    }

    const type = provider.type === "OTP SDK" ? "OTP SDK" : "Gateway";
    const normalizedProvider = {
      id: provider.id,
      name: provider.name ?? "",
      type,
      apiKey: provider.apiKey ?? "",
      region: provider.region ?? "",
    };

    if (!normalizedProvider.id || seenIds.has(normalizedProvider.id)) {
      normalizedProvider.id = generateProviderId();
      dirty = true;
    }
    seenIds.add(normalizedProvider.id);

    if (type === "Gateway") {
      normalizedProvider.senderId = provider.senderId ?? "";
      normalizedProvider.active = !!provider.active;
      normalizedProvider.isDefault = !!provider.isDefault;

      if (normalizedProvider.active) {
        if (activeLocked) {
          normalizedProvider.active = false;
          normalizedProvider.isDefault = false;
          dirty = true;
        } else {
          activeLocked = true;
        }
      }

      if (normalizedProvider.isDefault) {
        if (!normalizedProvider.active) {
          normalizedProvider.isDefault = false;
          dirty = true;
        } else if (defaultLocked) {
          normalizedProvider.isDefault = false;
          dirty = true;
        } else {
          defaultLocked = true;
        }
      }

      normalizedProvider.name = normalizedProvider.name.trim();
      normalizedProvider.apiKey = normalizedProvider.apiKey.trim();
      normalizedProvider.senderId = normalizedProvider.senderId.trim();
      normalizedProvider.region = normalizedProvider.region.trim();

      normalized.push(normalizedProvider);
      return;
    }

    if (otpIncluded) {
      dirty = true;
      return;
    }

    otpIncluded = true;
    normalizedProvider.name = normalizedProvider.name.trim();
    normalizedProvider.apiKey = normalizedProvider.apiKey.trim();
    normalizedProvider.region = normalizedProvider.region.trim();
    normalized.push(normalizedProvider);
  });

  return { providers: normalized, dirty };
};

const validateProviders = (providers = []) => {
  const errors = [];

  providers.forEach((provider) => {
    if (provider.type === "Gateway" && provider.active) {
      const missing = REQUIRED_GATEWAY_FIELDS.filter((field) => !provider[field]);
      if (missing.length) {
        errors.push({
          id: provider.id,
          type: provider.type,
          fields: missing,
        });
      }
    }

    if (provider.type === "OTP SDK") {
      const missing = REQUIRED_OTP_FIELDS.filter((field) => !provider[field]);
      if (missing.length) {
        errors.push({
          id: provider.id,
          type: provider.type,
          fields: missing,
        });
      }
    }
  });

  return errors;
};

exports.getSettings = async () => {
  const currentRaw = (await readJsonSetting(SETTINGS_KEY)) || {};
  const current =
    currentRaw && typeof currentRaw === "object" ? { ...currentRaw } : {};
  const { providers, dirty } = normalizeProviders(current.providers || []);
  current.providers = providers;

  if (dirty) {
    await writeJsonSetting(SETTINGS_KEY, current);
  }

  return current;
};

exports.updateSettings = async (settings = {}) => {
  const incomingProviders = Array.isArray(settings.providers)
    ? settings.providers
    : [];
  const { providers } = normalizeProviders(incomingProviders);
  const errors = validateProviders(providers);

  if (errors.length) {
    throw new AppError("Invalid message configuration", 400, { details: errors });
  }

  const sanitizedSettings = {
    ...settings,
    providers,
  };

  await writeJsonSetting(SETTINGS_KEY, sanitizedSettings);
  return sanitizedSettings;
};
