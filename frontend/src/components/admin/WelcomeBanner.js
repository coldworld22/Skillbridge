// components/admin/WelcomeBanner.js
import { useTranslation } from "next-i18next";

const localeFallbacks = {
  ar: "ar-SA",
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  hi: "hi-IN",
  it: "it-IT",
  zh: "zh-CN",
};

export default function WelcomeBanner({ name = "Admin" }) {
  const { t, i18n } = useTranslation("dashboard");

  const language = i18n?.language || "en";
  const [baseLanguage] = language.split("-");
  const locale =
    localeFallbacks[language] || localeFallbacks[baseLanguage] || language;

  const today = new Date().toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold text-gray-800">
        {t("welcome_banner_greeting", { name })}
      </h1>
      <p className="text-sm text-gray-500">
        {t("welcome_banner_today", { date: today })}
      </p>
    </div>
  );
}
  