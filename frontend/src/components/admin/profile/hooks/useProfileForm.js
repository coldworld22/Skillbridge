import { useState, useEffect } from "react";

const initialForm = {
  full_name: "",
  phone: "",
  gender: "",
  date_of_birth: "",
  avatar_url: null,
  job_title: "",
  department: "",
  identityFile: null,
  identityPreview: null,
  isPDF: false,
  socialLinks: {},
};

const useProfileForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminProfileForm");
      return saved ? JSON.parse(saved) : initialForm;
    }
    return initialForm;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminProfileForm", JSON.stringify(formData));
    }
  }, [formData]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return {
    step,
    setStep,
    formData,
    setFormData,
    nextStep,
    prevStep,
  };
};

export default useProfileForm;
