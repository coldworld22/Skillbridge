import { i18n } from "next-i18next";
import useAppConfigStore from "@/store/appConfigStore";
import useAuthStore from "@/store/auth/authStore";

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
    "en-US";

  const currency =
    override.currency ||
    useAuthStore.getState().user?.currency ||
    useAuthStore.getState().user?.pricing_currency ||
    useAppConfigStore.getState().settings?.currency ||
    "USD";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

  return getCurrencyFormatter(formatterOptions).format(numeric);
};

