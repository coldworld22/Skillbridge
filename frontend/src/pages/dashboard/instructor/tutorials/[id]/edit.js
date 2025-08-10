// EditTutorialPage.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BasicInfoStep from '@/components/tutorials/create/BasicInfoStep';
import CurriculumStep from '@/components/tutorials/create/CurriculumStep';
import MediaStep from '@/components/tutorials/create/MediaStep';
import ReviewStep from '@/components/tutorials/create/ReviewStep';
import { fetchInstructorTutorialById } from "@/services/instructor/tutorialService";
import { updateTutorial } from "@/services/instructor/tutorialService";
import { fetchAllCategories } from "@/services/instructor/categoryService";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function EditTutorialPage() {
  const router = useRouter();
  const { t } = useTranslation(["common", "dashboard", "tutorials"]);
  const { id } = router.query;
  const [step, setStep] = useState(1);
  const [tutorialData, setTutorialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  const user = useAuthStore((state) => state.user);
  const refreshNotifications = useNotificationStore((state) => state.fetch);
  const refreshMessages = useMessageStore((state) => state.fetch);

  useEffect(() => {
    if (!id) return;
    const draft = localStorage.getItem(`editTutorialDraft-${id}`);
    if (draft) {
      const parsed = JSON.parse(draft);
      setTutorialData({
        ...parsed,
        language: parsed.language || "",
        lessonCount: parsed.lessonCount || parsed.chapters?.length || 1,
      });

      const loadCats = async () => {
        try {
          const cats = await fetchAllCategories();
          setCategories(cats?.data || cats || []);
        } catch (err) {
          console.error(err);
          setError(t("tutorials:detail.load_error"));
        } finally {
          setLoading(false);
        }
      };
      loadCats();
      return;
    }

    const load = async () => {
      try {
        const [tutorial, cats] = await Promise.all([
          fetchInstructorTutorialById(id),
          fetchAllCategories(),
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
        setCategories(cats?.data || cats || []);
      } catch (err) {
        console.error(err);
        setError(t("tutorials:detail.load_error"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (tutorialData && id) {
      localStorage.setItem(`editTutorialDraft-${id}`, JSON.stringify(tutorialData));
    }
  }, [tutorialData, id]);

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
              const formData = new FormData();
              formData.append("title", tutorialData.title);
              formData.append("description", tutorialData.shortDescription);
              formData.append("category_id", tutorialData.category);
              formData.append("level", tutorialData.level);
              formData.append("language", tutorialData.language);
              formData.append("is_paid", (!tutorialData.isFree).toString());
              if (!tutorialData.isFree) {
                formData.append("price", tutorialData.price);
              }
              formData.append(
                "tags",
                JSON.stringify(tutorialData.tags || [])
              );
              const chapters = (tutorialData.chapters || []).map((ch, idx) => ({
                title: ch.title,
                duration: ch.duration,
                video_url: ch.videoUrl,
                order: idx + 1,
                is_preview: ch.preview,
              }));
              formData.append("chapters", JSON.stringify(chapters));
              if (tutorialData.thumbnail instanceof File) {
                formData.append("thumbnail", tutorialData.thumbnail);
              }
              if (tutorialData.preview instanceof File) {
                formData.append("preview", tutorialData.preview);
              }

              try {
                await updateTutorial(id, formData);
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
                  toast.error('Failed to send notification or message');
                }

                refreshNotifications?.();
                refreshMessages?.();
                localStorage.removeItem(`editTutorialDraft-${id}`);
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


