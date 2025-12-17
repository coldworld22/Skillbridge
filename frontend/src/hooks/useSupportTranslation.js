import { useTranslation } from "next-i18next";

const buildKeyVariants = (key) => {
  if (typeof key !== "string") return [key];
  if (key.startsWith("sidebar.") || key.includes(".")) return [key];
  return [key, `sidebar.${key}`];
};

const normalizeKeyInput = (key) => {
  if (Array.isArray(key)) {
    return key.flatMap((item) => buildKeyVariants(item));
  }
  return buildKeyVariants(key);
};

/**
 * Provides a translation helper tailored for the support module.
 * Falls back to `sidebar.*` keys when a top-level key is missing.
 */
export default function useSupportTranslation(ns = "dashboard") {
  const translation = useTranslation(ns);

  const supportT = (key, options) => {
    const keys = normalizeKeyInput(key);
    return translation.t(keys, options);
  };

  return {
    ...translation,
    t: supportT,
    rawT: translation.t,
  };
}
