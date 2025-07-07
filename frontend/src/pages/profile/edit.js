import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import PersonalDetails from "../../components/profile/steps/PersonalDetails";
import Verification from "../../components/profile/steps/Verification";
import RoleSelection from "../../components/profile/steps/RoleSelection";
import StudentDetails from "../../components/profile/steps/StudentDetails";
import InstructorDetails from "../../components/profile/steps/InstructorDetails";
import SocialLinks from "../../components/profile/steps/SocialLinks";
import FinalReview from "../../components/profile/steps/FinalReview";

const steps = [
  { id: 1, title: "Personal Details" },
  { id: 2, title: "Verification" },
  { id: 3, title: "Select Role" },
  { id: 4, title: "Student Details", role: "student" },
  { id: 5, title: "Instructor Details", role: "instructor" },
  { id: 6, title: "Social Links" },
  { id: 7, title: "Review & Submit" },
];

const ProfileEdit = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    profilePicture: "",
    verification: { emailVerified: false, phoneVerified: false },
    role: "",
    studentDetails: { topics: [], educationLevel: "", learningGoals: "" },
    instructorDetails: { expertise: [], experience: "", certifications: "", availability: "", pricing: "" },
    socialLinks: { linkedin: "", portfolio: "", socialMedia: "" },
  });

  const nextStep = (targetStep = null) => {
    if (targetStep) {
      setStep(targetStep); // Skip to the appropriate step
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => prev - 1);
  const currentStep = steps.find((s) => s.id === step);

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      {/* ✅ Navbar Component */}
      <Navbar />

      {/* ✅ Profile Setup Card */}
      <div className="max-w-3xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg mt-0 pt-28">
        {/* ✅ Step Title & Progress */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-xl font-bold">{currentStep?.title}</h2>
          <span className="text-gray-400">Step {step} of {steps.length}</span>
        </div>

        {/* ✅ Progress Bar */}
        <div className="relative w-full bg-gray-700 rounded-full h-2 mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-2 bg-yellow-500 rounded-full shadow-lg"
          />
        </div>

        {/* ✅ Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.4 }}
        >
          {step === 1 && <PersonalDetails formData={formData} setFormData={setFormData} />}
          {step === 2 && <Verification formData={formData} setFormData={setFormData} />}
          {step === 3 && <RoleSelection formData={formData} setFormData={setFormData} onNext={nextStep} />}
          {step === 4 && formData.role === "student" && <StudentDetails formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />}
          {step === 5 && formData.role === "instructor" && <InstructorDetails formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />}
          {step === 6 && <SocialLinks formData={formData} setFormData={setFormData} />}
          {step === 7 && <FinalReview formData={formData} />}
        </motion.div>

        {/* ✅ Navigation Buttons */}
        <div className="flex justify-between mt-6">
          {step > 1 && (
            <button
              className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              onClick={prevStep}
            >
              <FaArrowLeft /> Back
            </button>
          )}
          {step < steps.length && (
            <button
              className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2 ml-auto"
              onClick={() => nextStep()}
            >
              Next <FaArrowRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
