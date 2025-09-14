import { useState, useEffect } from "react";
import { buildTutorialFormData } from "@/utils/tutorialDraft";
import { toast } from "react-toastify";

// Shared hook for tutorial creation form
// Handles form state, step navigation, category fetching and FormData generation
export default function useTutorialCreation({ fetchCategories } = {}) {
  const [step, setStep] = useState(1);
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
    currency: "",
    isFree: false,
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const savedDraft = localStorage.getItem("tutorialDraft");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setTutorialData((prev) => ({
          ...prev,
          ...draft,
          thumbnail: null,
          preview: null,
          language: draft.language || "",
          lessonCount: draft.lessonCount || draft.chapters?.length || 1,
          currency: draft.currency || "",
        }));
      } catch (err) {
        console.error("Failed to parse tutorialDraft", err);
        localStorage.removeItem("tutorialDraft");
      }
    }

    const loadCategories = async () => {
      if (!fetchCategories) return;
      try {
        const result = await fetchCategories();
        // support both array and {data: []}
        setCategories(result?.data || result || []);
      } catch (err) {
        console.error("Failed to load categories", err);
        toast.error("Failed to load categories");
      }
    };

    loadCategories();
  }, [fetchCategories]);

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const buildFormData = (status) => buildTutorialFormData(tutorialData, status);

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    tutorialData,
    setTutorialData,
    categories,
    buildFormData,
  };
}

