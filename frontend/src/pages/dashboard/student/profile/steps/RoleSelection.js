import { useState } from "react";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

const RoleSelection = ({
  formData = {},
  setFormData = () => {},
  onNext = () => {},
  prevStep = () => {},
}) => {
  const [role, setRole] = useState(formData.role || "");

  const handleNext = () => {
    if (!role) {
      alert("Please select a role or skip if not applicable.");
      return;
    }
    setFormData({ ...formData, role });
    onNext(role === "student" ? 4 : role === "instructor" ? 5 : 6);
  };

  const handleSkip = () => {
    setFormData({ ...formData, role: "guest" }); // or keep it as null
    onNext(6); // Go directly to SocialLinks or next universal step
  };

  return (
    <div className="p-6 bg-gray-800 text-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">Select Your Role</h2>
      <p className="text-sm text-gray-300 mb-6">
        Choose your role to personalize your experience. If you're unsure, you can skip this step.
      </p>

      <div className="flex gap-4 mb-6">
        <button
          className={`p-4 border rounded-lg flex-1 ${
            role === "student" ? "bg-blue-500 text-white" : "bg-gray-700"
          }`}
          onClick={() => setRole("student")}
        >
          Student
        </button>
        <button
          className={`p-4 border rounded-lg flex-1 ${
            role === "instructor" ? "bg-green-500 text-white" : "bg-gray-700"
          }`}
          onClick={() => setRole("instructor")}
        >
          Instructor
        </button>
      </div>

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={prevStep}
          className="flex items-center gap-2 px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          <FaArrowLeft /> Back
        </button>
        <div className="flex flex-col items-end">
          <button
            onClick={handleNext}
            disabled={!role}
            className="flex items-center gap-2 px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition"
          >
            Next <FaArrowRight />
          </button>
          {!role && (
            <button
              onClick={handleSkip}
              className="text-sm text-yellow-400 hover:underline mt-2"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
