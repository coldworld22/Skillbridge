const AppError = require("../../../utils/AppError");

const BASE_CURRENCY = (
  process.env.CHECKOUT_CURRENCY ||
  process.env.DEFAULT_CURRENCY ||
  "USD"
).toUpperCase();

// ISO currencies with no minor units.
const ZERO_DECIMAL_CURRENCIES = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

const normalizeCurrency = (value) => {
  if (value === undefined || value === null) {
    return BASE_CURRENCY;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed.toUpperCase() : BASE_CURRENCY;
  }
  return String(value).trim().toUpperCase() || BASE_CURRENCY;
};

const enforceBaseCurrency = (value, message) => {
  const normalized = normalizeCurrency(value);
  if (normalized !== BASE_CURRENCY) {
    throw new AppError(message || `Currency must be ${BASE_CURRENCY}`, 400);
  }
  return normalized;
};

const getMinorUnitsMultiplier = (currency) =>
  ZERO_DECIMAL_CURRENCIES.has(normalizeCurrency(currency)) ? 1 : 100;

module.exports = {
  BASE_CURRENCY,
  ZERO_DECIMAL_CURRENCIES,
  normalizeCurrency,
  enforceBaseCurrency,
  getMinorUnitsMultiplier,
};
