import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import useProfileForm from "./hooks/useProfileForm";

import AdminLayout from "@/components/layouts/AdminLayout";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import StudentLayout from "@/components/layouts/StudentLayout";
import useAuthStore from "@/store/auth/authStore";

import PersonalDetails from "./steps/PersonalDetails";
import Verification from "./steps/Verification";
import RoleSelection from "./steps/RoleSelection";
import StudentDetails from "./steps/StudentDetails";
import InstructorDetails from "./steps/InstructorDetails";
import SocialLinks from "./steps/SocialLinks";
import FinalReview from "./steps/FinalReview";

const steps = [
  { id: 1, title: "Personal Details" },
  { id: 2, title: "Verification" },
  { id: 3, title: "Select Role" },
  { id: 4, title: "Student Details", role: "student" },
  { id: 5, title: "Instructor Details", role: "instructor" },
  { id: 6, title: "Social Links" },
  { id: 7, title: "Review & Submit" },
];

export default function ProfileEdit() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();

  const {
    step,
    setStep,
    formData,
    setFormData,
    nextStep,
    prevStep,
  } = useProfileForm();

  const currentStep = steps.find((s) => s.id === step);

  const Layout =
    role === "admin"
      ? AdminLayout
      : role === "instructor"
      ? InstructorLayout
      : StudentLayout;

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
        Complete Your Profile
      </h1>

      <div className="max-w-3xl mx-auto p-6 bg-gray-50 rounded-3xl shadow-xl mt-10 text-gray-900 border border-gray-200">
        {/* Step Title */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-semibold">{currentStep?.title}</h2>
          <span className="text-sm text-gray-500">
            Step {step} of {steps.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full bg-gray-200 rounded-full h-2 mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
            className="h-2 bg-yellow-500 rounded-full"
          />
        </div>

        {/* Step Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          {step === 1 && <PersonalDetails formData={formData} setFormData={setFormData} />}
          {step === 2 && <Verification formData={formData} setFormData={setFormData} />}
          {step === 3 && <RoleSelection formData={formData} setFormData={setFormData} onNext={nextStep} />}
          {step === 4 && formData.role === "student" && (
            <StudentDetails
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}
          {step === 5 && formData.role === "instructor" && (
            <InstructorDetails
              formData={formData}
              setFormData={setFormData}
              nextStep={nextStep}
              prevStep={prevStep}
            />
          )}
          {step === 6 && <SocialLinks formData={formData} setFormData={setFormData} />}
          {step === 7 && <FinalReview formData={formData} />}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-2 px-5 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
            >
              <FaArrowLeft /> Back
            </button>
          ) : (
            <div />
          )}

          {step < steps.length && (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-500 text-white hover:bg-yellow-600 rounded-lg transition ml-auto"
            >
              Next <FaArrowRight />
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
