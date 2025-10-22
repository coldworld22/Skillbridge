import { i18n } from "next-i18next";
import useAppConfigStore from "@/store/appConfigStore";
import useAuthStore from "@/store/auth/authStore";

const DEFAULT_CURRENCY = "USD";
const FALLBACK_LOCALE = "en-US";

const normalizeCurrency = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : null;
};

const resolveCurrency = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeCurrency(candidate);
    if (normalized) return normalized;
  }
  return DEFAULT_CURRENCY;
};

const createFormatter = (locale, currency) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Build an Intl.NumberFormat using the current locale and currency from
 * configuration or user preferences.
 *
 * @param {Object} [override]
 * @param {string} [override.locale] - Locale to override.
 * @param {string} [override.currency] - Currency code to override.
 */
export const getCurrencyFormatter = (override = {}) => {
  const locale =
    override.locale ||
    i18n?.language ||
    useAppConfigStore.getState().settings?.locale ||
    FALLBACK_LOCALE;

  const currency = resolveCurrency(
    override.currency,
    useAuthStore.getState().user?.currency,
    useAuthStore.getState().user?.pricing_currency,
    useAppConfigStore.getState().settings?.currency,
  );

  try {
    return createFormatter(locale, currency);
  } catch (err) {
    // Invalid locale or currency codes from the API/config can surface here.
    // Fall back to safe defaults so rendering continues without crashing.
    console.warn(
      `[currency] Falling back due to formatter error (locale=${locale}, currency=${currency}):`,
      err?.message || err,
    );
    try {
      if (locale !== FALLBACK_LOCALE) {
        return createFormatter(FALLBACK_LOCALE, currency);
      }
    } catch {
      // ignore and fall through
    }
    return createFormatter(FALLBACK_LOCALE, DEFAULT_CURRENCY);
  }
};

/**
 * Format a numeric value as currency using locale and currency from
 * configuration or user settings.
 */
export const formatCurrency = (value, override = {}) => {
  const { fallback, ...formatterOptions } = override;
  const numeric = Number(value ?? 0);

  if (!Number.isFinite(numeric)) {
    return fallback ?? "—";
  }

  try {
    return getCurrencyFormatter(formatterOptions).format(numeric);
  } catch (err) {
    const currency = resolveCurrency(
      formatterOptions.currency,
      useAuthStore.getState().user?.currency,
      useAuthStore.getState().user?.pricing_currency,
      useAppConfigStore.getState().settings?.currency,
    );
    console.warn(
      `[currency] Falling back to string formatter (currency=${currency}):`,
      err?.message || err,
    );
    const symbol = currency === DEFAULT_CURRENCY ? "$" : `${currency} `;
    const formatted = Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
    return `${symbol}${formatted}`;
  }
};
