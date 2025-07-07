import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaUpload,
  FaTrash,
  FaCheckCircle,
} from "react-icons/fa";

const StudentDetails = ({
  formData = {},
  setFormData = () => {},
  nextStep = () => {},
  prevStep = () => {},
}) => {
  const [errors, setErrors] = useState({});

  // ✅ Safe fallback for nested fields
  const studentData = formData.studentDetails || {
    educationLevel: "",
    learningGoals: "",
    learningStyle: "",
    studySchedule: "",
    profilePicture: "",
  };

  const [profilePic, setProfilePic] = useState(studentData.profilePicture || "");

  // ✅ Update form data on input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      studentDetails: {
        ...studentData,
        [e.target.name]: e.target.value,
      },
    });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // ✅ Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfilePic(imageUrl);
      setFormData({
        ...formData,
        studentDetails: {
          ...studentData,
          profilePicture: imageUrl,
        },
      });
    }
  };

  // ✅ Remove profile picture
  const removeImage = () => {
    setProfilePic(null);
    setFormData({
      ...formData,
      studentDetails: {
        ...studentData,
        profilePicture: "",
      },
    });
  };

  // ✅ Validation logic
  const validateForm = () => {
    const newErrors = {};
    if (!studentData.educationLevel) newErrors.educationLevel = "Education level is required";
    if (!studentData.learningGoals) newErrors.learningGoals = "Learning goals are required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <motion.div
      className="p-6 bg-gray-800 text-white rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">Student Details</h2>

      {/* ✅ Profile Picture Upload */}
      <div className="flex flex-col items-center mb-4">
        {profilePic ? (
          <div className="relative">
            <img
              src={profilePic}
              alt="Profile Preview"
              className="w-24 h-24 rounded-full border-2 border-yellow-500"
            />
            <button
              onClick={removeImage}
              className="absolute top-0 right-0 bg-red-600 text-white p-1 rounded-full"
            >
              <FaTrash />
            </button>
          </div>
        ) : (
          <label className="cursor-pointer flex flex-col items-center bg-gray-700 p-3 rounded-lg text-yellow-400 hover:bg-gray-600">
            <FaUpload size={20} />
            <span className="text-sm mt-1">Upload Profile Picture</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        )}
      </div>

      {/* ✅ Education Level */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Education Level</label>
        <select
          name="educationLevel"
          value={studentData.educationLevel}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-gray-800 text-white"
        >
          <option value="">Select your education level</option>
          <option value="High School">High School</option>
          <option value="Undergraduate">Undergraduate</option>
          <option value="Postgraduate">Postgraduate</option>
          <option value="Other">Other</option>
        </select>
        {errors.educationLevel && (
          <p className="text-red-500 text-xs mt-1">{errors.educationLevel}</p>
        )}
      </div>

      {/* ✅ Learning Goals */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Learning Goals</label>
        <input
          type="text"
          name="learningGoals"
          value={studentData.learningGoals}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-gray-800 text-white"
        />
        {errors.learningGoals && (
          <p className="text-red-500 text-xs mt-1">{errors.learningGoals}</p>
        )}
      </div>

      {/* ✅ Preferred Learning Style */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Preferred Learning Style</label>
        <select
          name="learningStyle"
          value={studentData.learningStyle}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-gray-800 text-white"
        >
          <option value="">Select your preferred learning style</option>
          <option value="Online">Online</option>
          <option value="In-person">In-person</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>

      {/* ✅ Study Schedule */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Preferred Study Schedule</label>
        <input
          type="text"
          name="studySchedule"
          value={studentData.studySchedule}
          onChange={handleChange}
          placeholder="e.g., Evenings, Weekends"
          className="w-full p-2 border rounded bg-gray-800 text-white"
        />
      </div>

      {/* ✅ Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          onClick={prevStep}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
          onClick={() => {
            if (validateForm()) nextStep();
          }}
        >
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default StudentDetails;
