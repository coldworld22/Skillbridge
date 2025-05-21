import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
  FaYoutube,
} from "react-icons/fa";

const SocialLinks = ({ formData, setFormData, onNext, onBack }) => {
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [e.target.name]: e.target.value },
    });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateURL = (name, value) => {
    const urlRegex = /^(https?:\/\/)?([\w\d]+\.)?[\w\d]+\.\w+\/?.*$/;
    if (value && !urlRegex.test(value)) {
      setErrors((prev) => ({ ...prev, [name]: "Enter a valid URL" }));
    }
  };

  return (
    <motion.div
      className="p-6 bg-white text-gray-900 rounded-3xl shadow-xl border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-2 text-yellow-600">🔗 Social Profiles</h2>
      <p className="text-sm text-gray-600 mb-6">Add your public links to showcase your presence.</p>

      {[
        { name: "linkedin", placeholder: "LinkedIn Profile", icon: <FaLinkedin className="text-blue-500" /> },
        { name: "github", placeholder: "GitHub Profile", icon: <FaGithub className="text-gray-700" /> },
        { name: "twitter", placeholder: "Twitter Profile", icon: <FaTwitter className="text-blue-400" /> },
        { name: "website", placeholder: "Personal Website", icon: <FaGlobe className="text-green-500" /> },
        { name: "youtube", placeholder: "YouTube Channel", icon: <FaYoutube className="text-red-500" /> },
      ].map(({ name, placeholder, icon }) => (
        <div key={name} className="mb-4">
          <label className="block text-sm font-medium text-gray-800 mb-1">{placeholder}</label>
          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
            {icon}
            <input
              type="url"
              name={name}
              value={formData.socialLinks[name] || ""}
              onChange={handleChange}
              onBlur={(e) => validateURL(name, e.target.value)}
              placeholder={`https://your-${name}.com`}
              className="ml-3 w-full bg-transparent text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-yellow-500"
            />
          </div>
          {errors[name] && (
            <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
          )}
        </div>
      ))}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          onClick={onBack}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
          onClick={onNext}
        >
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default SocialLinks;
