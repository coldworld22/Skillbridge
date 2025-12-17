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

const fallbackFormat = (value, currency = DEFAULT_CURRENCY) => {
  const numericValue = Number(value ?? 0);
  const safeNumeric = Number.isFinite(numericValue) ? numericValue : 0;
  const code = normalizeCurrency(currency) || DEFAULT_CURRENCY;
  const symbol = code === DEFAULT_CURRENCY ? "$" : `${code} `;
  return `${symbol}${safeNumeric.toFixed(2)}`;
};

const createManualFormatter = (currency) => {
  const code = normalizeCurrency(currency) || DEFAULT_CURRENCY;
  return {
    format: (value) => fallbackFormat(value, code),
  };
};

let hasWarnedMissingIntl = false;

const attemptIntlFormatter = (locale, currency) => {
  if (typeof Intl !== "object" || typeof Intl.NumberFormat !== "function") {
    if (!hasWarnedMissingIntl) {
      console.warn(
        "[currency] Intl.NumberFormat is not available; using basic formatter instead.",
      );
      hasWarnedMissingIntl = true;
    }
    return null;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch (err) {
    console.warn(
      `[currency] Failed to create formatter (locale=${locale}, currency=${currency}):`,
      err?.message || err,
    );
    return null;
  }
};

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

  const primaryFormatter = attemptIntlFormatter(locale, currency);
  if (primaryFormatter) {
    return primaryFormatter;
  }

  if (locale !== FALLBACK_LOCALE) {
    const fallbackLocaleFormatter = attemptIntlFormatter(
      FALLBACK_LOCALE,
      currency,
    );
    if (fallbackLocaleFormatter) {
      return fallbackLocaleFormatter;
    }
  }

  const defaultCurrencyFormatter = attemptIntlFormatter(
    FALLBACK_LOCALE,
    DEFAULT_CURRENCY,
  );
  if (defaultCurrencyFormatter) {
    return defaultCurrencyFormatter;
  }

  return createManualFormatter(currency);
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
    return fallbackFormat(numeric, currency);
  }
};
