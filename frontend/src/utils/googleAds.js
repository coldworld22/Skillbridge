import { configureGtag, ensureGtag, loadGtagScript, sendGtagEvent } from "./gtag";

let googleAdsConfig = null;

const normalizeConversions = (conversions) => {
  if (!Array.isArray(conversions)) return [];
  return conversions
    .map((conv) => ({
      event: conv?.event?.trim() || "",
      sendTo: conv?.sendTo?.trim() || "",
      defaultValue:
        conv?.defaultValue !== undefined && conv?.defaultValue !== null
          ? Number(conv.defaultValue)
          : undefined,
      defaultCurrency: conv?.defaultCurrency?.trim() || "",
    }))
    .filter((conv) => conv.event && conv.sendTo);
};

const normalizeConfig = (cfg) => {
  if (!cfg || typeof cfg !== "object") return null;
  return {
    conversionId: cfg.conversionId?.trim() || "",
    remarketingEnabled:
      typeof cfg.remarketingEnabled === "boolean"
        ? cfg.remarketingEnabled
        : true,
    enhancedConversions: {
      enabled: Boolean(cfg?.enhancedConversions?.enabled),
      dataLayerKey: cfg?.enhancedConversions?.dataLayerKey?.trim() || "",
    },
    conversions: normalizeConversions(cfg.conversions),
  };
};

const readEnhancedConversionData = (dataLayerKey) => {
  if (typeof window === "undefined" || !dataLayerKey) return null;

  const direct = window[dataLayerKey];
  if (direct && typeof direct === "object") {
    return direct;
  }

  if (Array.isArray(window.dataLayer)) {
    const entry = window.dataLayer
      .slice()
      .reverse()
      .find(
        (item) =>
          item &&
          typeof item === "object" &&
          Object.prototype.hasOwnProperty.call(item, dataLayerKey)
      );
    if (entry && typeof entry[dataLayerKey] === "object") {
      return entry[dataLayerKey];
    }
  }

  return null;
};

export const initializeGoogleAds = (cfg) => {
  const normalized = normalizeConfig(cfg);
  googleAdsConfig = normalized;

  if (typeof window !== "undefined") {
    window.__googleAdsConfig = normalized;
  }

  if (!normalized || !normalized.conversionId) {
    return;
  }

  loadGtagScript(normalized.conversionId, "data-google-ads-id");
  configureGtag(normalized.conversionId, {
    allow_enhanced_conversions: Boolean(
      normalized.enhancedConversions?.enabled
    ),
    send_page_view: false,
  });

  if (
    normalized.enhancedConversions?.enabled &&
    normalized.enhancedConversions?.dataLayerKey
  ) {
    const data = readEnhancedConversionData(
      normalized.enhancedConversions.dataLayerKey
    );
    if (data) {
      sendEnhancedConversionData(data);
    }
  }
};

export const sendEnhancedConversionData = (data) => {
  if (!data || typeof data !== "object") return;
  const gtag = ensureGtag();
  if (!gtag) return;
  gtag("set", "user_data", data);
};

export const getGoogleAdsConfig = () => googleAdsConfig;

export const isGoogleAdsEnabled = () =>
  Boolean(googleAdsConfig?.conversionId);

export const recordGoogleAdsConversion = (eventKey, params = {}) => {
  if (!eventKey || !isGoogleAdsEnabled()) return false;
  const conversions = Array.isArray(googleAdsConfig.conversions)
    ? googleAdsConfig.conversions
    : [];
  const conversion = conversions.find(
    (conv) => conv.event === eventKey
  );
  if (!conversion || !conversion.sendTo) return false;

  const payload = {
    send_to: conversion.sendTo,
  };

  const value =
    params.value !== undefined && params.value !== null
      ? Number(params.value)
      : conversion.defaultValue;
  if (!Number.isNaN(value) && value !== undefined) {
    payload.value = value;
  }

  const currency =
    params.currency || conversion.defaultCurrency || params.defaultCurrency;
  if (currency) {
    payload.currency = currency;
  }

  if (params.transaction_id) {
    payload.transaction_id = params.transaction_id;
  }
  if (params.user_id) {
    payload.user_id = params.user_id;
  }
  if (params.event_callback) {
    payload.event_callback = params.event_callback;
  }
  if (params.order_id) {
    payload.order_id = params.order_id;
  }

  const { value: _value, currency: _currency, ...rest } = params;
  Object.keys(rest).forEach((key) => {
    if (
      !Object.prototype.hasOwnProperty.call(payload, key) &&
      rest[key] !== undefined
    ) {
      payload[key] = rest[key];
    }
  });

  sendGtagEvent("conversion", payload);
  return true;
};

export const recordGoogleAdsPageView = (params = {}) => {
  if (!isGoogleAdsEnabled()) return false;
  sendGtagEvent("page_view", {
    send_to: googleAdsConfig.conversionId,
    ...params,
  });
  return true;
};
