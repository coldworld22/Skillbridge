import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import BasicInfoStep from "@/components/tutorials/create/BasicInfoStep";
import CurriculumStep from "@/components/tutorials/create/CurriculumStep";
import MediaStep from "@/components/tutorials/create/MediaStep";
import ReviewStep from "@/components/tutorials/create/ReviewStep";
import { createTutorial } from "@/services/admin/tutorialService";
import { fetchAllCategories } from "@/services/admin/categoryService";
import StepProgressBar from "@/components/tutorials/create/StepProgressBar";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import { buildTutorialFormData } from "@/utils/tutorialForm";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { fetchPlanIdentifiers } from "@/services/admin/planService";

function CreateTutorialPage() {
  const { t } = useTranslation('dashboard', { keyPrefix: 'tutorialCreatePage' });
  const { t: tTutorials } = useTranslation("tutorials");
  const user = useAuthStore((s) => s.user);
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);
  const notify = async (type, message) => {
    if (!user?.id) {
      toast.warn('Notification skipped: missing user data.');
      return;
    }

    try {
      await createNotification({ user_id: user.id, type, message });
      await sendChatMessage(user.id, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || t('failed_create');
      toast.error(msg);
    }
  };
  const [step, setStep] = useState(1);
  const router = useRouter();
  const [tutorialData, setTutorialData] = useState({
    title: "",
    shortDescription: "",
    category: "",
    categoryName: "",
    level: "",
    lessonCount: 1,
    tags: [],
    chapters: [],
    thumbnail: null,
    preview: null,
    language: "",
    price: "",
    isFree: false,
    currency: "",
    includedPlans: [],
  });

  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const fieldLabels = useMemo(
    () => ({
      title: tTutorials("create.basic.title_label"),
      shortDescription: tTutorials("create.basic.short_desc_label"),
      description: tTutorials("create.basic.short_desc_label"),
      category_id: tTutorials("create.basic.category_label"),
      level: tTutorials("create.basic.level_label"),
      language: tTutorials("create.basic.language_label"),
      price: tTutorials("create.basic.price_label"),
      currency: tTutorials("create.basic.select_currency", "Currency"),
      tags: tTutorials("create.basic.tags_label"),
      included_plans: tTutorials("create.basic.plan_access_label", "Included Plans"),
      status: t("step_pricing_publish"),
    }),
    [t, tTutorials]
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
        console.error("Failed to load categories", err);
        toast.error(t('load_categories_failed'));
      }
    };

    const loadPlans = async () => {
      try {
        const identifiers = await fetchPlanIdentifiers();
        setPlans(Array.isArray(identifiers) ? identifiers : []);
      } catch (err) {
        console.error("Failed to load plans", err);
        setPlans([]);
      }
    };

    loadCategories();
    loadPlans();
  }, []);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);


  const submitTutorial = async (status) => {
    if (tutorialData.chapters.some((ch) => !ch.videoUrl)) {
      toast.error(t('upload_video_each_lesson'));
      return;
    }
    if (
      tutorialData.isFree &&
      (!tutorialData.includedPlans || tutorialData.includedPlans.length === 0)
    ) {
      toast.error(t('plan_required_for_free'));
      return;
    }

    const formData = buildTutorialFormData(tutorialData, status);

    try {
      await createTutorial(formData);
      toast.success(
        status === "draft" ? t('draft_saved') : t('submitted_success')
      );
      const msg =
        status === "draft"
          ? `Tutorial "${tutorialData.title}" saved as draft.`
          : `Tutorial "${tutorialData.title}" submitted for approval.`;
      notify('tutorial_created', msg);
      localStorage.removeItem("tutorialDraft");
      router.push("/dashboard/admin/tutorials");
    } catch (err) {
      console.error(err);
      console.error("Tutorial creation error response:", err.response?.data);
      const apiErrors = err.response?.data?.errors;
      const formatIssue = (issue) => {
        if (!issue) return null;
        const pathSegments = Array.isArray(issue.path)
          ? issue.path.filter((seg) => seg !== "body")
          : [];
        let label = "";
        if (pathSegments.length === 0 && issue.field) {
          label = fieldLabels[issue.field] || issue.field;
        } else if (pathSegments.length) {
          if (pathSegments[0] === "chapters") {
            const chapterIndex = Number(pathSegments[1]);
            const chapterNumber = Number.isFinite(chapterIndex)
              ? chapterIndex + 1
              : undefined;
            const chapterField = pathSegments[2] || pathSegments[1];
            if (chapterField === "title") {
              label = chapterNumber
                ? `${tTutorials("create.curriculum.chapter_title")} #${chapterNumber}`
                : tTutorials("create.curriculum.chapter_title");
            } else if (chapterField === "video_url") {
              label = chapterNumber
                ? `${tTutorials("create.curriculum.upload_video")} #${chapterNumber}`
                : tTutorials("create.curriculum.upload_video");
            } else if (chapterField === "duration") {
              label = chapterNumber
                ? `${tTutorials("create.curriculum.duration_label")} #${chapterNumber}`
                : tTutorials("create.curriculum.duration_label");
            } else {
              label = pathSegments.join(".");
            }
          } else {
            const joined = pathSegments.join(".");
            label = fieldLabels[pathSegments[0]] || fieldLabels[joined] || joined;
          }
        }
        const message = issue.message || issue.msg || issue.code || t('failed_create');
        if (label) return `${label}: ${message}`;
        return message;
      };
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const details = apiErrors
          .map(formatIssue)
          .filter(Boolean)
          .join("\n");
        toast.error(details || err.response?.data?.message || t('failed_create'));
      } else if (apiErrors && typeof apiErrors === "object") {
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
          .join(", ");
        toast.error(details || err.response?.data?.message || t('failed_create'));
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t('failed_create'));
      }
    }
  };

  const publishTutorial = () => submitTutorial("published");
  const saveDraft = () => submitTutorial("draft");

  return (
    <AdminLayout>
      <div className="p-8 bg-gray-100 min-h-screen max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🎬 {t('title')}</h1>

        {/* Step Progress */}
        <StepProgressBar
          steps={[
            t('step_basic_info'),
            t('step_curriculum'),
            t('step_media'),
            t('step_pricing_publish'),
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
                ⬅️ {t('back')}
              </button>
            )}
            <button
              onClick={saveDraft}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-bold"
            >
              💾 {t('save_draft')}
            </button>
          </div>
          {step < 4 && (
            <button
              onClick={nextStep}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full font-bold"
            >
              {t('next')} ➡️
            </button>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuthProtection(CreateTutorialPage, {
  permissions: ["manage_tutorials"],
});

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard", "tutorials"],
        nextI18NextConfig
      )),
    },
  };
}
