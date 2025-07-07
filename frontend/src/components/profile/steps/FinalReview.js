import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaCheckCircle, FaUpload, FaExclamationTriangle, FaPlayCircle, FaTrash } from "react-icons/fa";

const FinalReview = ({ formData, prevStep }) => {
  const [isAgreed, setIsAgreed] = useState(false);
  const [demoVideo, setDemoVideo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // ✅ Handle Demo Video Upload with Progress Simulation
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // ✅ Validate file type and size (max 100MB)
    if (!file.type.includes("video")) {
      alert("❌ Please upload a valid video file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert("❌ Video file size should be less than 100MB.");
      return;
    }

    setDemoVideo(file.name);
    setUploadProgress(0);

    // 🔹 Simulating Upload Progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) clearInterval(interval);
    }, 300);
  };

  // ✅ Remove Video
  const removeVideo = () => {
    setDemoVideo(null);
    setUploadProgress(0);
  };

  // ✅ Handle Submission
  const handleSubmit = () => {
    if (!isAgreed) {
      alert("You must agree to the terms & conditions before submitting.");
      return;
    }

    if (formData.role === "instructor" && !demoVideo) {
      alert("Instructors must upload a demo video.");
      return;
    }

    // 🔹 Send to Admin for Approval
    console.log("🚀 Submitting Profile for Review:", formData);

    // ✅ Mark as Submitted
    setSubmitted(true);

    // 🔹 Send Email Verification (Mock)
    setTimeout(() => {
      alert("📧 Verification email has been sent!");
    }, 1500);
  };

  return (
    <motion.div
      className="p-6 bg-gray-800 text-white rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">Final Review & Submit</h2>

      {/* ✅ Profile Summary */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">👤 Personal Details</h3>
        <p><strong>Name:</strong> {formData.name}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Phone:</strong> {formData.phone}</p>
      </div>

      {/* ✅ Role-Specific Details */}
      {formData.role === "instructor" && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">🎓 Instructor Details</h3>
          <p><strong>Expertise:</strong> {formData.instructorDetails.expertise.join(", ")}</p>
          <p><strong>Experience:</strong> {formData.instructorDetails.experience}</p>
          <p><strong>Certifications:</strong> {formData.instructorDetails.certifications}</p>
        </div>
      )}

      {/* ✅ Social Links */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold">🔗 Social Links</h3>
        <p><strong>LinkedIn:</strong> {formData.socialLinks?.linkedin || "Not Provided"}</p>
        <p><strong>Portfolio:</strong> {formData.socialLinks?.portfolio || "Not Provided"}</p>
      </div>

      {/* ✅ Demo Video Upload (For Instructors Only) */}
      {formData.role === "instructor" && (
        <div className="mb-6 bg-gray-700 p-4 rounded-lg">
          <label className="block text-gray-300 mb-2 flex items-center gap-2">
            <FaUpload className="text-yellow-400" /> Upload Demo Lesson Video:
          </label>

          {!demoVideo ? (
            <div className="flex items-center gap-3 bg-gray-600 p-3 rounded-lg cursor-pointer hover:bg-gray-500 transition">
              <label htmlFor="videoUpload" className="cursor-pointer">
                Click to Upload
              </label>
              <input 
                id="videoUpload"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoUpload}
              />
            </div>
          ) : (
            <div className="p-4 bg-gray-900 rounded-lg flex items-center justify-between">
              <span className="text-gray-300 flex items-center gap-2">
                <FaPlayCircle className="text-green-400" /> {demoVideo}
              </span>
              <button className="text-red-500 hover:text-red-700" onClick={removeVideo}>
                <FaTrash />
              </button>
            </div>
          )}

          {/* ✅ Upload Progress Bar */}
          {uploadProgress > 0 && (
            <div className="mt-2 bg-gray-600 rounded-full h-2 w-full overflow-hidden">
              <div
                className="h-2 bg-yellow-500 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* ✅ Terms & Conditions */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="terms"
          checked={isAgreed}
          onChange={() => setIsAgreed(!isAgreed)}
          className="mr-2 w-5 h-5"
        />
        <label htmlFor="terms" className="text-gray-300">
          I agree to the <a href="#" className="text-yellow-500 underline">Terms & Conditions</a>
        </label>
      </div>

      {/* ✅ Submission Message */}
      {submitted && (
        <div className="p-4 bg-green-700 text-white rounded-lg mb-4 flex items-center gap-2">
          <FaCheckCircle /> Your profile has been submitted for admin review! 🚀
        </div>
      )}

      {/* ✅ Navigation & Submit Buttons */}
      <div className="flex justify-between mt-6">
        <button
          className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          onClick={prevStep}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          className={`px-5 py-2 rounded-lg transition flex items-center gap-2 ${
            isAgreed ? "bg-yellow-500 text-gray-900 hover:bg-yellow-600" : "bg-gray-600 cursor-not-allowed text-gray-400"
          }`}
          onClick={handleSubmit}
          disabled={!isAgreed}
        >
          Submit <FaCheckCircle />
        </button>
      </div>

      {/* ✅ Warning for Admin Approval */}
      <div className="mt-4 p-4 bg-red-700 text-white rounded-lg flex items-center gap-2">
        <FaExclamationTriangle />
        Note: Your profile will be **reviewed by an admin** before you can start creating courses.
      </div>
    </motion.div>
  );
};

export default FinalReview;
