import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { allowedPlatforms, defaultPlatformIcon } from "@/utils/socialPlatforms";

const SocialLinks = ({ formData, setFormData, onNext, onBack }) => {
  const [errors, setErrors] = useState({});

  // ✅ Handle Input Change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      socialLinks: { ...formData.socialLinks, [e.target.name]: e.target.value },
    });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // Validation removed to allow any text values
  const validateURL = () => {};

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

      {allowedPlatforms.map(({ name, Icon, className }) => {
        const IconComponent = Icon || defaultPlatformIcon.Icon;
        if (!IconComponent) {
          return null;
        }
        const iconClassName = className || defaultPlatformIcon.className;

        return (
          <div key={name} className="mb-4">
            <label className="block text-sm font-medium">
              {`${name.charAt(0).toUpperCase() + name.slice(1)} Profile`}
            </label>
            <div className="flex items-center bg-gray-700 rounded-lg p-2">
              <IconComponent className={iconClassName} />
              <input
                type="text"
                name={name}
                value={formData.socialLinks[name] || ""}
                onChange={handleChange}
                className="w-full p-2 bg-gray-700 text-white border-none focus:outline-none ml-3"
                placeholder={
                  name === 'website'
                    ? 'https://yourwebsite.com'
                    : `https://${name}.com`
                }
              />
            </div>
            {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
          </div>
        );
      })}

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
