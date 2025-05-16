// EditTutorialPage.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import BasicInfoStep from '@/components/tutorials/create/BasicInfoStep';
import CurriculumStep from '@/components/tutorials/create/CurriculumStep';
import MediaStep from '@/components/tutorials/create/MediaStep';
import ReviewStep from '@/components/tutorials/create/ReviewStep';

export default function EditTutorialPage() {
  const router = useRouter();
  const { id } = router.query;

  const [step, setStep] = useState(1);
  const [tutorialData, setTutorialData] = useState(null);

  useEffect(() => {
    if (id) {
      const draft = localStorage.getItem(`editTutorialDraft-${id}`);
      if (draft) {
        setTutorialData(JSON.parse(draft));
      } else {
        // Mock fetch tutorial by ID
        const found = sampleTutorials.find((tut) => tut.id === parseInt(id));
        if (found) {
          setTutorialData({
            title: found.title,
            shortDescription: "",
            category: "",
            level: "",
            tags: [],
            chapters: [],
            thumbnail: found.thumbnail,
            preview: null,
            price: "",
            isFree: false,
          });
        }
      }
    }
  }, [id]);

  useEffect(() => {
    if (tutorialData && id) {
      localStorage.setItem(`editTutorialDraft-${id}`, JSON.stringify(tutorialData));
    }
  }, [tutorialData, id]);

  const onNext = () => setStep((prev) => prev + 1);
  const onPrev = () => setStep((prev) => prev - 1);

  if (!tutorialData) return <div className="p-6">Loading...</div>;

  return (
    <AdminLayout>
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
    </AdminLayout>
  );
}

const sampleTutorials = [
  {
    id: 1,
    title: "Mastering React.js",
    status: "Draft",
    updatedAt: "2024-05-01T10:00:00Z",
    thumbnail: "https://via.placeholder.com/300x180",
    progress: 40,
  },
  {
    id: 2,
    title: "Node.js Basics",
    status: "Submitted",
    updatedAt: "2024-05-02T14:30:00Z",
    thumbnail: "https://via.placeholder.com/300x180",
  },
  {
    id: 3,
    title: "Introduction to AI",
    status: "Approved",
    updatedAt: "2024-05-03T09:00:00Z",
    thumbnail: "https://via.placeholder.com/300x180",
  },
];
