import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import BasicInfoStep from "@/components/tutorials/create/BasicInfoStep";
import CurriculumStep from "@/components/tutorials/create/CurriculumStep";
import MediaStep from "@/components/tutorials/create/MediaStep";
import ReviewStep from "@/components/tutorials/create/ReviewStep";
import { createTutorial } from "@/services/admin/tutorialService";
import { fetchAllCategories } from "@/services/admin/categoryService";

export default function CreateTutorialPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();
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


  const submitTutorial = async (status) => {
    const formData = new FormData();
    formData.append("title", tutorialData.title);
    formData.append("description", tutorialData.shortDescription);
    formData.append("category_id", tutorialData.category);
    formData.append("level", tutorialData.level);
    formData.append("status", status);
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
    if (tutorialData.thumbnail) formData.append("thumbnail", tutorialData.thumbnail);
    if (tutorialData.preview) formData.append("preview", tutorialData.preview);

    try {
      await createTutorial(formData);
      toast.success(
        status === "draft"
          ? "Tutorial saved as draft!"
          : "Tutorial submitted for approval!"
      );
      localStorage.removeItem("tutorialDraft");
      router.push("/dashboard/admin/tutorials");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to create tutorial");
      }
    }
  };

  const publishTutorial = () => submitTutorial("published");
  const saveDraft = () => submitTutorial("draft");

  return (
    <AdminLayout>
      <Toaster position="top-center" />
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
    </AdminLayout>
  );
}
