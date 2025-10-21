import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { fetchAllCategories } from "@/services/instructor/categoryService";
import { createTutorial } from "@/services/instructor/tutorialService";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BasicInfoStep from "@/components/tutorials/create/BasicInfoStep";
import CurriculumStep from "@/components/tutorials/create/CurriculumStep";
import MediaStep from "@/components/tutorials/create/MediaStep";
import ReviewStep from "@/components/tutorials/create/ReviewStep";
import StepProgressBar from "@/components/tutorials/create/StepProgressBar";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import { fetchStudentPlanIdentifiers } from "@/services/instructor/planService";
import { buildTutorialFormData } from "@/utils/tutorialForm";

export default function CreateTutorialPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { t } = useTranslation(["dashboard", "tutorials"]);
  const [tutorialData, setTutorialData] = useState({
    title: "",
    shortDescription: "",
    category: "",
    categoryName: "",
    level: "",
    language: "",
    lessonCount: 1,
    tags: [],
    chapters: [],
    thumbnail: null,
    preview: null,
    price: "",
    currency: "",
    isFree: false,
    includedPlans: [],
    allowInstallments: false,
    installments: "2",
  });

  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const fieldLabels = useMemo(
    () => ({
      title: t("tutorials:create.basic.title_label", "Title"),
      shortDescription: t("tutorials:create.basic.short_desc_label", "Short Description"),
      description: t("tutorials:create.basic.short_desc_label", "Description"),
      category_id: t("tutorials:create.basic.category_label", "Category"),
      level: t("tutorials:create.basic.level_label", "Level"),
      language: t("tutorials:create.basic.language_label", "Language"),
      price: t("tutorials:create.basic.price_label", "Price"),
      currency: t("tutorials:create.basic.select_currency", "Currency"),
      tags: t("tutorials:create.basic.tags_label", "Tags"),
      included_plans: t("tutorials:create.basic.plan_access_label", "Included Plans"),
      allow_installments: t("tutorials:create.basic.allow_installments_label", "Offer installment payments"),
      installments: t("tutorials:create.basic.installments_label", "Installments"),
      status: t("dashboard:tutorialCreatePage.step_pricing_publish"),
    }),
    [t]
  );

  useEffect(() => {
    const savedDraft = localStorage.getItem("tutorialDraft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTutorialData({
          ...draft,
          thumbnail: null,
          preview: null,
          language: draft.language || "",
          lessonCount: draft.lessonCount || draft.chapters?.length || 1,
          currency: draft.currency || "",
          includedPlans: Array.isArray(draft.includedPlans)
            ? draft.includedPlans
                .filter((id) => id !== null && id !== undefined)
                .map((id) => String(id))
            : [],
          allowInstallments: Boolean(
            draft.allowInstallments ?? draft.allow_installments ?? false
          ),
          installments: draft.installments
            ? String(draft.installments)
            : draft.allowInstallments || draft.allow_installments
            ? "2"
            : "1",
        });
      } catch (err) {
        console.error("Failed to parse tutorialDraft", err);
        localStorage.removeItem("tutorialDraft");
      }
    }

    const loadCategories = async () => {
      try {
        const result = await fetchAllCategories();
        const resolvedCategories = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.items)
          ? result.items
          : [];
        setCategories(resolvedCategories);
      } catch (err) {
        console.error(t('tutorialCreatePage.load_categories_failed', { ns: 'dashboard' }), err);
      }
    };

    const loadPlans = async () => {
      try {
        const identifiers = await fetchStudentPlanIdentifiers();
        setPlans(Array.isArray(identifiers) ? identifiers : []);
      } catch (err) {
        console.error("Failed to load plans", err);
        setPlans([]);
      }
    };

    loadCategories();
    loadPlans();
  }, [t]);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const submitTutorial = async (status) => {
    if (tutorialData.chapters.some((ch) => !ch.videoUrl)) {
      toast.error(t("dashboard:tutorialCreatePage.upload_video_each_lesson"));
      return;
    }
    if (
      tutorialData.isFree &&
      (!tutorialData.includedPlans || tutorialData.includedPlans.length === 0)
    ) {
      toast.error(t("dashboard:tutorialCreatePage.plan_required_for_free"));
      return;
    }
    const formData = buildTutorialFormData(tutorialData, status);

    try {
      await createTutorial(formData);
      toast.success(
        status === "draft"
          ? t("dashboard:tutorialCreatePage.draft_saved")
          : t("dashboard:tutorialCreatePage.submitted_success")
      );
      localStorage.removeItem("tutorialDraft");
      router.push("/dashboard/instructor/tutorials");
    } catch (err) {
      console.error(err);
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const formatIssue = (issue) => {
          if (!issue) return null;
          const pathSegments = Array.isArray(issue.path)
            ? issue.path.filter((seg) => seg !== "body")
            : [];
          let label = "";
          if (pathSegments.length === 0 && issue.path?.length === 1 && issue.path[0] !== "body") {
            const key = issue.path[0];
            label = fieldLabels[key] || key;
          } else if (pathSegments.length) {
            if (pathSegments[0] === "chapters") {
              const chapterIndex = Number(pathSegments[1]);
              const chapterNumber = Number.isFinite(chapterIndex)
                ? chapterIndex + 1
                : undefined;
              const chapterField = pathSegments[2] || pathSegments[1];
              if (chapterField === "title") {
                label = chapterNumber
                  ? `${t("tutorials:create.curriculum.chapter_title")} #${chapterNumber}`
                  : t("tutorials:create.curriculum.chapter_title");
              } else if (chapterField === "video_url") {
                label = chapterNumber
                  ? `${t("tutorials:create.curriculum.upload_video")} #${chapterNumber}`
                  : t("tutorials:create.curriculum.upload_video");
              } else if (chapterField === "duration") {
                label = chapterNumber
                  ? `${t("tutorials:create.curriculum.duration_label")} #${chapterNumber}`
                  : t("tutorials:create.curriculum.duration_label");
              } else {
                label = pathSegments.join(".");
              }
            } else {
              const topKey = pathSegments[0];
              const joined = pathSegments.join(".");
              label = fieldLabels[topKey] || fieldLabels[joined] || joined;
            }
          }
          const message = issue.message || issue.msg || issue.code || t("dashboard:tutorialCreatePage.failed_create");
          if (label) return `${label}: ${message}`;
          return message;
        };
        const details = apiErrors.map(formatIssue).filter(Boolean).join("\n");
        toast.error(details || err.response?.data?.message || t("dashboard:tutorialCreatePage.failed_create"));
        return;
      }
      if (apiErrors && typeof apiErrors === "object") {
        const details = Object.entries(apiErrors)
          .map(([key, value]) => {
            if (!value) return null;
            const msg =
              typeof value === "string"
                ? value
                : Array.isArray(value)
                ? value.join(", ")
                : JSON.stringify(value);
            const label = fieldLabels[key] || key;
            return `${label}: ${msg}`;
          })
          .filter(Boolean)
          .join("\n");
        if (details) {
          toast.error(details);
          return;
        }
      }
      toast.error(err.response?.data?.message || t("dashboard:tutorialCreatePage.failed_create"));
    }
  };

  const publishTutorial = () => submitTutorial("published");

  const saveDraft = () => submitTutorial("draft");

  return (
    <InstructorLayout>
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t("dashboard:tutorialCreatePage.title")}</h1>

        {/* Step Progress */}
        <StepProgressBar
          steps={[
            t("dashboard:tutorialCreatePage.step_basic_info"),
            t("dashboard:tutorialCreatePage.step_curriculum"),
            t("dashboard:tutorialCreatePage.step_media"),
            t("dashboard:tutorialCreatePage.step_pricing_publish"),
          ]}
          currentStep={step}
          onStepClick={(s) => {
            if (s < step) setStep(s);
          }}
        />

        {/* Step Content */}
        <div className="bg-white p-8 rounded-lg shadow space-y-6">
          {step === 1 && (
            <BasicInfoStep
              tutorialData={tutorialData}
              setTutorialData={setTutorialData}
              onNext={nextStep}
              categories={categories}
              plans={plans}
            />
          )}
          {step === 2 && (
            <CurriculumStep
              tutorialData={tutorialData}
              setTutorialData={setTutorialData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {step === 3 && (
            <MediaStep
              tutorialData={tutorialData}
              setTutorialData={setTutorialData}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {step === 4 && (
            <ReviewStep
              tutorialData={tutorialData}
              plans={plans}
              onBack={prevStep}
              onPublish={publishTutorial}
            />
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex justify-between items-center mt-8">
          <div className="flex gap-4">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-full font-bold"
              >
                {t("dashboard:tutorialCreatePage.back")}
              </button>
            )}
            <button
              onClick={saveDraft}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-bold"
            >
              {t("dashboard:tutorialCreatePage.save_draft")}
            </button>
          </div>
          {step < 4 && (
            <button
              onClick={nextStep}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full font-bold"
            >
              {t("dashboard:tutorialCreatePage.next")}
            </button>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard", "tutorials"], nextI18NextConfig)),
    },
  };
}
