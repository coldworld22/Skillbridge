// components/admin/WelcomeBanner.js
import { useTranslation } from "next-i18next";

export default function WelcomeBanner({ name = "Admin" }) {
  const { t, i18n } = useTranslation("dashboard");
  const today = new Date();
  const formattedDate = today.toLocaleDateString(i18n.language, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-bold text-gray-800">
        {t("welcome_admin", { name })}
      </h1>
      <p className="text-sm text-gray-500">
        {t("today_is", { date: formattedDate })}
      </p>
    </div>
  );
}
