const path = require('path');

module.exports = {
  i18n: {
    // Only English and Arabic are currently active. The remaining
    // languages are commented out until translations are completed.
    locales: ["en", "ar"], // Supported Languages
    // locales: ["en", "fr", "ar", "de", "es"],
    defaultLocale: "en",
    localeDetection: false,
  },
  // Fallback to English if a translation is missing
  fallbackLng: "en",
  // Explicitly point next-i18next to the translation files
  // Resolve the locale path relative to this config file so that
  // translations load correctly when the app is started from the
  // frontend directory or the repository root.
  localePath: path.resolve(__dirname, "public", "locales"),
};

