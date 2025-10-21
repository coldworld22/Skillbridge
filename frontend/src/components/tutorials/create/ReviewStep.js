import { FaCheckCircle } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { formatCurrency } from "@/utils/currency";

export default function ReviewStep({
  tutorialData,
  plans = [],
  onBack,
  onPublish,
  actionLabel,
}) {
  const { t } = useTranslation("tutorials");
  const publishText = actionLabel || t("create.review.publish_tutorial");
  const includedPlanNames = Array.isArray(tutorialData.includedPlans)
    ? tutorialData.includedPlans.map((planId) => {
        const match = plans.find((p) => String(p.id) === String(planId));
        if (!match) return planId;
        if (match.name && match.slug) {
          return `${match.name} (${match.slug})`;
        }
        return match.name || match.slug || planId;
      })
    : [];
  return (
    <div className="space-y-8">

      {/* Review Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          {t("create.review.heading")}
        </h2>
        <button
          onClick={onBack}
          className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-full font-bold"
        >
          {t("create.review.back")}
        </button>
      </div>

      {/* Summary Box */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-6">

        {/* Basic Info */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> {t("create.review.sections.basic_info")}
          </h3>
          <p>
            <strong>{t("create.review.labels.title")}</strong> {tutorialData.title}
          </p>
          <p>
            <strong>{t("create.review.labels.short_description")}</strong>
            {" "}
            {tutorialData.shortDescription}
          </p>
          <p>
            <strong>{t("create.review.labels.category")}</strong>{" "}
            {tutorialData.categoryName || tutorialData.category}
          </p>
          <p>
            <strong>{t("create.review.labels.level")}</strong> {tutorialData.level}
          </p>
          {tutorialData.tags.length > 0 && (
            <p>
              <strong>{t("create.review.labels.tags")}</strong>{" "}
              {tutorialData.tags.join(", ")}
            </p>
          )}
        </div>

        {/* Curriculum */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> {t("create.review.sections.curriculum")}
          </h3>
          {tutorialData.chapters.length > 0 ? (
            <ul className="list-disc pl-5">
              {tutorialData.chapters.map((chapter, index) => (
                <li key={index}>
                  {chapter.title} ({chapter.duration})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">{t("create.review.no_chapters")}</p>
          )}
        </div>

        {/* Media */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> {t("create.review.sections.media")}
          </h3>
          <div className="flex gap-6 items-center">
            {tutorialData.thumbnail && (
              <img
                src={
                  tutorialData.thumbnail instanceof File
                    ? URL.createObjectURL(tutorialData.thumbnail)
                    : tutorialData.thumbnail
                }
                alt={t("create.media.thumbnail_preview_alt")}
                className="w-32 h-20 object-cover rounded shadow"
              />
            )}
            {tutorialData.preview && (
              <video
                src={
                  tutorialData.preview instanceof File
                    ? URL.createObjectURL(tutorialData.preview)
                    : tutorialData.preview
                }
                controls
                className="w-32 h-20 rounded shadow"
              />
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> {t("create.review.sections.pricing")}
          </h3>
          {tutorialData.isFree ? (
            <p className="text-green-600 font-semibold">{t("create.review.free")}</p>
          ) : (
            <p className="text-gray-800">
              <strong>{t("create.review.price_label")}</strong>{" "}
              {formatCurrency(tutorialData.price, {
                currency: tutorialData.currency,
              })}
            </p>
          )}
          {!tutorialData.isFree && tutorialData.allowInstallments && (
            <p className="text-gray-700 text-sm">
              {t("create.review.installments_summary", {
                defaultValue: "Installments enabled: pay over {{count}} months.",
                count: tutorialData.installments || 2,
              })}
            </p>
          )}
        </div>

        {/* Access */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <FaCheckCircle /> {t("create.review.sections.access")}
          </h3>
          {includedPlanNames.length > 0 ? (
            <ul className="list-disc pl-5">
              {includedPlanNames.map((name, idx) => (
                <li key={idx}>{name}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">
              {t(
                "create.review.no_plans",
                "No student plans selected. Tutorial will be publicly accessible."
              )}
            </p>
          )}
        </div>

      </div>

      {/* Publish Button */}
      <div className="text-center mt-8">
        <button
          onClick={onPublish}
          className="bg-yellow-500 hover:bg-yellow-600 text-black px-8 py-4 rounded-full font-bold text-xl transition-all shadow-lg"
        >
          🚀 {publishText}
        </button>
      </div>

    </div>
  );
}
