import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BasicInfoStep from '@/components/tutorials/create/BasicInfoStep';
import CurriculumStep from '@/components/tutorials/create/CurriculumStep';
import MediaStep from '@/components/tutorials/create/MediaStep';
import ReviewStep from '@/components/tutorials/create/ReviewStep';
import { fetchInstructorTutorialById, updateTutorial } from "@/services/instructor/tutorialService";
import { fetchAllCategories } from "@/services/instructor/categoryService";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import {
  buildTutorialFormData,
  loadCategories,
  loadDraft,
  saveDraft,
  tutorialDraftDefaults,
  type TutorialDraft,
} from "@/utils/tutorialDraft";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const extractErrorMessage = (error: unknown): string | undefined => {
  if (!isRecord(error) || !("response" in error)) {
    return undefined;
  }

  const response = error.response;
  if (!isRecord(response) || !("data" in response)) {
    return undefined;
  }

  const data = response.data;
  if (!isRecord(data) || typeof data.message !== "string") {
    return undefined;
  }

  return data.message;
};

export default function EditTutorialPage() {
  const router = useRouter();
  const { t } = useTranslation(["common", "dashboard", "tutorials"]);
  const { id } = router.query;
  const tutorialId = Array.isArray(id) ? id[0] : id;
  const [step, setStep] = useState(1);
  const [tutorialData, setTutorialData] = useState<TutorialDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<unknown[]>([]);

  const user = useAuthStore((state) => state.user);
  const refreshNotifications = useNotificationStore((state) => state.fetch);
  const refreshMessages = useMessageStore((state) => state.fetch);

  useEffect(() => {
    if (!tutorialId) return;

    const storageKey = `editTutorialDraft-${tutorialId}`;
    if (typeof window !== "undefined") {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const draft = loadDraft(storageKey, tutorialDraftDefaults);
        setTutorialData(draft);
        loadCategories(fetchAllCategories)
          .then((cats) => setCategories(cats))
          .catch((err) => {
            console.error(err);
            setError(t("tutorials:detail.load_error"));
          })
          .finally(() => setLoading(false));
        return;
      }
    }

    const load = async () => {
      try {
        const [tutorial, cats] = await Promise.all([
          fetchInstructorTutorialById(tutorialId),
          loadCategories(fetchAllCategories),
        ]);
        const formatted = tutorial?.data || tutorial || null;
        if (formatted) {
          setTutorialData({
            ...formatted,
            language: formatted.language || "",
            lessonCount: formatted.chapters?.length || 1,
          });
        } else {
          setTutorialData(null);
        }
        setCategories(cats);
      } catch (err) {
        console.error(err);
        setError(extractErrorMessage(err) ?? t("tutorials:detail.load_error"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [tutorialId, t]);

  useEffect(() => {
    if (tutorialData && tutorialId) {
      saveDraft(`editTutorialDraft-${tutorialId}`, tutorialData);
    }
  }, [tutorialData, tutorialId]);

  const onNext = () => setStep((prev) => prev + 1);
  const onBack = () => setStep((prev) => prev - 1);

  if (loading) return <div className="p-6">{t("dashboard:tutorialEditPage.loading")}</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!tutorialData) return <div className="p-6">{t("dashboard:tutorialEditPage.not_found")}</div>;

  return (
    <InstructorLayout>
      <div className="p-6">
        {step === 1 && (
          <BasicInfoStep
            tutorialData={tutorialData}
            setTutorialData={setTutorialData}
            onNext={onNext}
            categories={categories}
          />
        )}
        {step === 2 && (
          <CurriculumStep
            tutorialData={tutorialData}
            setTutorialData={setTutorialData}
            onNext={onNext}
            onBack={onBack}
          />
        )}
        {step === 3 && (
          <MediaStep
            tutorialData={tutorialData}
            setTutorialData={setTutorialData}
            onNext={onNext}
            onBack={onBack}
          />
        )}
        {step === 4 && (
          <ReviewStep
            tutorialData={tutorialData}
            onBack={onBack}
            actionLabel={t("dashboard:tutorialEditPage.save_changes")}
            onPublish={async () => {
              if (!tutorialId) return;
              const formData = buildTutorialFormData(tutorialData);

              try {
                await updateTutorial(tutorialId, formData);
                toast.success(t("dashboard:tutorialEditPage.update_success"));

                try {
                  await createNotification({
                    user_id: user.id,
                    type: "tutorial_updated",
                    message: t("dashboard:tutorialEditPage.notification_updated", { title: tutorialData.title }),
                  });
                  await sendChatMessage(user.id, {
                    text: t("dashboard:tutorialEditPage.notification_updated", { title: tutorialData.title }),
                  });
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to send notification or message");
                }

                refreshNotifications?.();
                refreshMessages?.();
                localStorage.removeItem(`editTutorialDraft-${tutorialId}`);
                router.push("/dashboard/instructor/tutorials");
              } catch (err) {
                console.error(err);
                toast.error(t("dashboard:tutorialEditPage.update_failed"));
              }
            }}
          />
        )}
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
