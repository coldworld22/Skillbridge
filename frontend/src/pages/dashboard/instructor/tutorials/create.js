import { useState, useEffect } from "react";
import { fetchAllCategories } from "@/services/admin/categoryService";
import InstructorLayout from '@/components/layouts/InstructorLayout';
import BasicInfoStep from "@/components/tutorials/create/BasicInfoStep";
import CurriculumStep from "@/components/tutorials/create/CurriculumStep";
import MediaStep from "@/components/tutorials/create/MediaStep";
import ReviewStep from "@/components/tutorials/create/ReviewStep";

export default function CreateTutorialPage() {
  const [step, setStep] = useState(1);
  const [tutorialData, setTutorialData] = useState({
    title: "",
    shortDescription: "",
    category: "",
    categoryName: "",
    level: "",
    tags: [],
    chapters: [],
    thumbnail: null,
    preview: null,
    price: "",
    isFree: false,
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const savedDraft = localStorage.getItem("tutorialDraft");
    if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      setTutorialData({ ...draft, thumbnail: null, preview: null });
    }

    const loadCategories = async () => {
      try {
        const result = await fetchAllCategories();

        setCategories(result?.data || []);

      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    loadCategories();
  }, []);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const saveDraft = () => {
    const { thumbnail, preview, ...serializable } = tutorialData;
    localStorage.setItem("tutorialDraft", JSON.stringify(serializable));
    alert("✅ Draft saved successfully!");
  };

  return (
    <InstructorLayout>
      <div className="p-8 bg-gray-100 min-h-screen">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">🎬 Create New Tutorial</h1>

        {/* Step Indicators */}
        <div className="flex justify-between mb-12">
          {["Basic Info", "Curriculum", "Media", "Pricing & Publish"].map((label, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold
                ${step === index + 1 ? "bg-yellow-500" : "bg-gray-400"}`}>
                {index + 1}
              </div>
              <span className={`mt-2 text-sm ${step === index + 1 ? "text-yellow-500" : "text-gray-500"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

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
                ⬅️ Back
              </button>
            )}
            <button
              onClick={saveDraft}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-bold"
            >
              💾 Save Draft
            </button>
          </div>
          {step < 4 && (
            <button
              onClick={nextStep}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-full font-bold"
            >
              Next ➡️
            </button>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}
