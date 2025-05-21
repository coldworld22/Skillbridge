import { useState } from "react";
import { motion } from "framer-motion";
import { FaUpload, FaTrash } from "react-icons/fa";

const InstructorDetails = ({ formData, setFormData, nextStep, prevStep }) => {
  const [errors, setErrors] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({
    courseCertificate: null,
    universityCertificate: null,
    experienceCertificate: null,
    additionalDocs: [],
  });

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      instructorDetails: {
        ...formData.instructorDetails,
        [e.target.name]: e.target.value,
      },
    });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // ✅ Handle Multiple File Uploads
  const handleFileUpload = (e, docType) => {
    const file = e.target.files[0];
    if (file) {
      if (docType === "additionalDocs") {
        setUploadedFiles((prev) => ({
          ...prev,
          additionalDocs: [...prev.additionalDocs, file.name],
        }));
      } else {
        setUploadedFiles((prev) => ({
          ...prev,
          [docType]: file.name,
        }));
      }
    }
  };

  // ✅ Remove File
  const removeFile = (docType, index = null) => {
    if (docType === "additionalDocs") {
      setUploadedFiles((prev) => ({
        ...prev,
        additionalDocs: prev.additionalDocs.filter((_, i) => i !== index),
      }));
    } else {
      setUploadedFiles((prev) => ({
        ...prev,
        [docType]: null,
      }));
    }
  };

  // ✅ Validate Form Fields
  const validateForm = () => {
    let newErrors = {};
    if (!formData.instructorDetails.experience) newErrors.experience = "Experience is required";
    if (!formData.instructorDetails.certifications) newErrors.certifications = "Certifications are required";
    if (!uploadedFiles.courseCertificate) newErrors.courseCertificate = "Upload a Course Certificate";
    if (!uploadedFiles.universityCertificate) newErrors.universityCertificate = "Upload a University Certificate";
    if (!uploadedFiles.experienceCertificate) newErrors.experienceCertificate = "Upload an Experience Certificate";

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
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">Instructor Verification</h2>

      {/* ✅ Teaching Experience */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Years of Teaching Experience</label>
        <input
          type="number"
          name="experience"
          value={formData.instructorDetails.experience}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-gray-800 text-white"
        />
        {errors.experience && <p className="text-red-500 text-xs mt-1">{errors.experience}</p>}
      </div>

      {/* ✅ Certifications */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Certifications</label>
        <input
          type="text"
          name="certifications"
          value={formData.instructorDetails.certifications}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-gray-800 text-white"
        />
        {errors.certifications && <p className="text-red-500 text-xs mt-1">{errors.certifications}</p>}
      </div>

      {/* ✅ Multi-File Uploads */}
      {[
        { label: "Course Certificate", type: "courseCertificate" },
        { label: "University Certificate", type: "universityCertificate" },
        { label: "Experience Certificate", type: "experienceCertificate" },
      ].map(({ label, type }) => (
        <div key={type} className="mb-4 bg-gray-700 p-4 rounded-lg">
          <label className="block text-gray-300 mb-2">{label}:</label>
          <div className="flex items-center gap-3 bg-gray-600 p-3 rounded-lg cursor-pointer hover:bg-gray-500 transition">
            <FaUpload className="text-yellow-400" />
            <label htmlFor={type} className="cursor-pointer">
              {uploadedFiles[type] ? uploadedFiles[type] : "Click to Upload"}
            </label>
            <input
              id={type}
              type="file"
              className="hidden"
              onChange={(e) => handleFileUpload(e, type)}
            />
          </div>
          {uploadedFiles[type] && (
            <button
              className="mt-2 text-red-500 text-xs flex items-center gap-1"
              onClick={() => removeFile(type)}
            >
              <FaTrash /> Remove
            </button>
          )}
          {errors[type] && <p className="text-red-500 text-xs mt-1">{errors[type]}</p>}
        </div>
      ))}

      {/* ✅ Additional Documents Upload */}
      <div className="mb-4 bg-gray-700 p-4 rounded-lg">
        <label className="block text-gray-300 mb-2">Additional Supporting Documents:</label>
        <div className="flex items-center gap-3 bg-gray-600 p-3 rounded-lg cursor-pointer hover:bg-gray-500 transition">
          <FaUpload className="text-yellow-400" />
          <label htmlFor="additionalDocs" className="cursor-pointer">
            Click to Upload
          </label>
          <input
            id="additionalDocs"
            type="file"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "additionalDocs")}
          />
        </div>
        {uploadedFiles.additionalDocs.length > 0 &&
          uploadedFiles.additionalDocs.map((doc, index) => (
            <div key={index} className="flex items-center justify-between mt-2 text-sm">
              <span>{doc}</span>
              <button
                className="text-red-500 text-xs flex items-center gap-1"
                onClick={() => removeFile("additionalDocs", index)}
              >
                <FaTrash /> Remove
              </button>
            </div>
          ))}
      </div>

      {/* ✅ Available Teaching Hours */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Available Teaching Hours (per week)</label>
        <input
          type="text"
          name="availability"
          value={formData.instructorDetails.availability}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-gray-800 text-white"
        />
      </div>

      {/* ✅ Course Pricing */}
      <div className="mb-4">
        <label className="block text-sm font-medium">Course Pricing ($ per course)</label>
        <input
          type="text"
          name="pricing"
          value={formData.instructorDetails.pricing}
          onChange={handleChange}
          className="w-full p-2 border rounded bg-gray-800 text-white"
        />
      </div>

      {/* ✅ Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          onClick={prevStep}
        >
          Back
        </button>
        <button
          className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
          onClick={() => validateForm() && nextStep()}
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};

export default InstructorDetails;
