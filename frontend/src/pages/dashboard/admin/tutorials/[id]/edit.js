// EditTutorialPage.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import BasicInfoStep from "@/components/tutorials/create/BasicInfoStep";
import CurriculumStep from "@/components/tutorials/create/CurriculumStep";
import MediaStep from "@/components/tutorials/create/MediaStep";
import ReviewStep from "@/components/tutorials/create/ReviewStep";
import {
  fetchTutorialById,
  updateTutorial,
} from "@/services/admin/tutorialService";
import { fetchAllCategories } from "@/services/admin/categoryService";
import { fetchChaptersByTutorial } from "@/services/admin/tutorialChapterService";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";

function EditTutorialPage() {
  const router = useRouter();
  const { id } = router.query;

  const [step, setStep] = useState(1);
  const [tutorialData, setTutorialData] = useState(null);
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
        lessonCount: parsed.lessonCount || parsed.chapters?.length || 1,
      });
      return;
    }

    const load = async () => {
      try {
        const [tutorial, chapters, cats] = await Promise.all([
          fetchTutorialById(id),
          fetchChaptersByTutorial(id),
          fetchAllCategories(),
        ]);
        const mappedChapters = chapters.map((ch) => ({
          title: ch.title,
          duration: ch.duration,
          video: `${process.env.NEXT_PUBLIC_API_BASE_URL}${ch.video_url}`,
          videoUrl: ch.video_url,
          preview: ch.is_preview,
        }));
        setTutorialData({
          title: tutorial.title,
          shortDescription: tutorial.shortDescription || "",
          category: tutorial.category,
          categoryName: tutorial.categoryName,
          level: tutorial.level,
          language: tutorial.language || "",
          instructorId: tutorial.instructorId,
          lessonCount: mappedChapters.length,
          tags: tutorial.tags || [],
          chapters: mappedChapters,
          thumbnail: tutorial.thumbnail,
          preview: tutorial.preview,
          price: tutorial.price || "",
          isFree: tutorial.isFree,
        });
        setCategories(cats?.data || cats);
      } catch (err) {
        console.error(err);
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
  const onPrev = () => setStep((prev) => prev - 1);

  if (!tutorialData)
    return <div className="p-6 max-w-4xl mx-auto">Loading...</div>;

  return (
    <AdminLayout>
      <div className="p-6 bg-gray-100 min-h-screen max-w-4xl mx-auto">
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
            onPrev={onPrev}
          />
        )}
        {step === 3 && (
          <MediaStep
            tutorialData={tutorialData}
            setTutorialData={setTutorialData}
            onNext={onNext}
            onPrev={onPrev}
          />
        )}
        {step === 4 && (
          <ReviewStep
            tutorialData={tutorialData}
            onPrev={onPrev}
            actionLabel="Save Changes"
            onPublish={async () => {
              const formData = new FormData();
              formData.append("title", tutorialData.title);
              formData.append("description", tutorialData.shortDescription);
              formData.append("category_id", tutorialData.category);
              formData.append("level", tutorialData.level);
              formData.append("is_paid", (!tutorialData.isFree).toString());
              if (!tutorialData.isFree) {
                formData.append("price", tutorialData.price);
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
              if (tutorialData.thumbnail instanceof File) {
                formData.append("thumbnail", tutorialData.thumbnail);
              }
              if (tutorialData.preview instanceof File) {
                formData.append("preview", tutorialData.preview);
              }

              try {
                await updateTutorial(id, formData);
                toast.success("Tutorial updated successfully!");
                await createNotification({
                  user_id: user.id,
                  type: "tutorial_updated",
                  message: `Tutorial "${tutorialData.title}" was updated.`,
                });
                if (tutorialData.instructorId) {
                  await createNotification({
                    user_id: tutorialData.instructorId,
                    type: "tutorial_updated",
                    message: `Your tutorial "${tutorialData.title}" was updated by admin.`,
                  });
                  await sendChatMessage(tutorialData.instructorId, {
                    text: `Your tutorial "${tutorialData.title}" was updated by admin.`,
                  });
                }
                await sendChatMessage(user.id, {
                  text: `Tutorial "${tutorialData.title}" was updated.`,
                });
                refreshNotifications?.();
                refreshMessages?.();
                localStorage.removeItem(`editTutorialDraft-${id}`);
                router.push("/dashboard/admin/tutorials");
              } catch (err) {
                console.error(err);
                toast.error("Failed to update tutorial");
              }
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuthProtection(EditTutorialPage, ["admin", "superadmin"]);
