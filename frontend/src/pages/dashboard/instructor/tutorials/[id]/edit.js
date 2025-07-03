// EditTutorialPage.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BasicInfoStep from '@/components/tutorials/create/BasicInfoStep';
import CurriculumStep from '@/components/tutorials/create/CurriculumStep';
import MediaStep from '@/components/tutorials/create/MediaStep';
import ReviewStep from '@/components/tutorials/create/ReviewStep';
import { fetchInstructorTutorialById } from "@/services/instructor/tutorialService";

export default function EditTutorialPage() {
  const router = useRouter();
  const { id } = router.query;

  const [step, setStep] = useState(1);
  const [tutorialData, setTutorialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const draft = localStorage.getItem(`editTutorialDraft-${id}`);
    if (draft) {
      const parsed = JSON.parse(draft);
      setTutorialData({
        ...parsed,
        lessonCount: parsed.lessonCount || parsed.chapters?.length || 1,
      });
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await fetchInstructorTutorialById(id);
        const formatted = data?.data || data || null;
        if (formatted) {
          setTutorialData({
            ...formatted,
            lessonCount: formatted.chapters?.length || 1,
          });
        } else {
          setTutorialData(null);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load tutorial");
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
  const onPrev = () => setStep((prev) => prev - 1);

  if (loading) return <div className="p-6">Loading tutorial...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!tutorialData) return <div className="p-6">Tutorial not found.</div>;

  return (
    <InstructorLayout>
      <div className="p-6">
        {step === 1 && (
          <BasicInfoStep
            tutorialData={tutorialData}
            setTutorialData={setTutorialData}
            onNext={onNext}
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
            onSubmit={() => {
              alert("✅ Tutorial Updated Successfully!");
              localStorage.removeItem(`editTutorialDraft-${id}`); // optional: clear draft after submit
              router.push("/dashboard/instructor/tutorials"); // go back to tutorials list
            }}
          />
        )}
      </div>
    </InstructorLayout>
  );
}


