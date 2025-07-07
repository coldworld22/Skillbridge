import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaLinkedin, FaGithub, FaTwitter, FaGlobe, FaYoutube } from "react-icons/fa";

const SocialLinks = ({
  formData = {},
  setFormData = () => {},
  onNext = () => {},
  onBack = () => {},
}) => {
  const [errors, setErrors] = useState({});
  const socialLinks = formData.socialLinks || {};

  // ✅ Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      socialLinks: { ...socialLinks, [name]: value },
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ Validate URLs
  const validateURL = (name, value) => {
    const urlRegex =
      /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
    if (value && !urlRegex.test(value.trim())) {
      setErrors((prev) => ({ ...prev, [name]: "Enter a valid URL" }));
    }
  };

  return (
    <motion.div
      className="p-6 bg-gray-800 text-white rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">Connect Your Social Profiles</h2>
      <p className="text-gray-400 mb-4 text-sm">Link your professional profiles to enhance credibility.</p>

      {[
        { name: "linkedin", placeholder: "LinkedIn Profile", icon: <FaLinkedin className="text-blue-400" /> },
        { name: "github", placeholder: "GitHub Profile", icon: <FaGithub className="text-gray-300" /> },
        { name: "twitter", placeholder: "Twitter Profile", icon: <FaTwitter className="text-blue-500" /> },
        { name: "website", placeholder: "Personal Website", icon: <FaGlobe className="text-green-400" /> },
        { name: "youtube", placeholder: "YouTube Channel", icon: <FaYoutube className="text-red-500" /> },
      ].map(({ name, placeholder, icon }) => (
        <div key={name} className="mb-4">
          <label className="block text-sm font-medium">{placeholder}</label>
          <div className="flex items-center bg-gray-700 rounded-lg p-2">
            {icon}
            <input
              type="url"
              name={name}
              value={socialLinks[name] || ""}
              onChange={handleChange}
              onBlur={(e) => validateURL(name, e.target.value)}
              className="w-full p-2 bg-gray-700 text-white border-none focus:outline-none ml-3"
              placeholder={`https://your-${name}.com`}
            />
          </div>
          {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
        </div>
      ))}

      {/* ✅ Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
          onClick={onBack}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
          onClick={onNext}
        >
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default SocialLinks;
