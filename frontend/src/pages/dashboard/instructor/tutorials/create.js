import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { fetchAllCategories } from "@/services/instructor/categoryService";
import { createTutorial } from "@/services/admin/tutorialService";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BasicInfoStep from "@/components/tutorials/create/BasicInfoStep";
import CurriculumStep from "@/components/tutorials/create/CurriculumStep";
import MediaStep from "@/components/tutorials/create/MediaStep";
import ReviewStep from "@/components/tutorials/create/ReviewStep";
import StepProgressBar from "@/components/tutorials/create/StepProgressBar";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

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
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const savedDraft = localStorage.getItem("tutorialDraft");
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setTutorialData({
        ...draft,
        thumbnail: null,
        preview: null,
        language: draft.language || "",
        lessonCount: draft.lessonCount || 1,
        currency: draft.currency || "",
      });
    }

    const loadCategories = async () => {
      try {
        const result = await fetchAllCategories();

        setCategories(result?.data || []);

      } catch (err) {
        console.error(t('tutorialCreatePage.load_categories_failed', { ns: 'dashboard' }), err);
      }
    };

    loadCategories();
  }, [t]);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const submitTutorial = async (status) => {
    if (tutorialData.chapters.some((ch) => !ch.videoUrl)) {
      toast.error(t("dashboard:tutorialCreatePage.upload_video_each_lesson"));
      return;
    }
    const formData = new FormData();
    formData.append("title", tutorialData.title);
    formData.append("description", tutorialData.shortDescription);
    formData.append("category_id", tutorialData.category);
    formData.append("level", tutorialData.level);
    formData.append("language", tutorialData.language);
    formData.append("status", status);
    formData.append("is_paid", (!tutorialData.isFree).toString());
    if (!tutorialData.isFree) {
      formData.append("price", tutorialData.price);
      if (tutorialData.currency) {
        formData.append("currency", tutorialData.currency);
      }
    }
    if (tutorialData.tags.length) {
      formData.append("tags", JSON.stringify(tutorialData.tags));
    }
    if (tutorialData.chapters.length) {
      const chapters = tutorialData.chapters.map((ch, idx) => ({
        title: ch.title,
        duration: ch.duration,
        video_url: ch.videoUrl,
        order: idx + 1,
        is_preview: ch.preview,
      }));
      formData.append("chapters", JSON.stringify(chapters));
    }
    if (tutorialData.thumbnail) formData.append("thumbnail", tutorialData.thumbnail);
    if (tutorialData.preview) formData.append("preview", tutorialData.preview);

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
