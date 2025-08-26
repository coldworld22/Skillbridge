const path = require('path');

module.exports = {
  i18n: {
    // Supported languages with available translations
    locales: ["en", "fr", "ar", "de", "es", "zh", "hi", "it"],
    defaultLocale: "ar",
    localeDetection: false,
  },
  // Fallback to English if a translation is missing
  fallbackLng: "en",
  // Explicitly point next-i18next to the translation files
  // Resolve the locale path relative to this config file so that
  // translations load correctly when the app is started from the
  // frontend directory or the repository root.
  // Use process.cwd() so the path resolves correctly when the app
  // is run from different directories (e.g. with Docker)
  localePath: path.resolve(process.cwd(), "public", "locales"),
};

