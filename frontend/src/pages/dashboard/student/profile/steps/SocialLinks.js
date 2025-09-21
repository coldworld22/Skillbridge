import { useState } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { allowedPlatforms, defaultPlatformIcon } from "@/utils/socialPlatforms";

const SocialLinks = ({
  formData = {},
  setFormData = () => {},
  onNext = () => {},
  onBack = () => {},
}) => {
  const [errors, setErrors] = useState({});
  const socialLinks = formData.socialLinks || {};

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      socialLinks: { ...socialLinks, [name]: value.trim() },
    });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Validation removed to allow any text values
  const validateURL = () => {};
  const isFormValid = true;

  return (
    <motion.div
      className="p-6 bg-white text-gray-900 rounded-3xl shadow-xl border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-2 text-yellow-600">🔗 Social Profiles</h2>
      <p className="text-sm text-gray-600 mb-6">
        Add any public links you'd like to showcase (optional).
      </p>

      {allowedPlatforms.map(({ name, Icon, className }) => {
        const IconComponent = Icon || defaultPlatformIcon.Icon;
        if (!IconComponent) {
          return null;
        }
        const iconClassName = className || defaultPlatformIcon.className;

        return (
          <div key={name} className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-800 mb-1">
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <IconComponent className={iconClassName} />
              <input
                id={name}
                type="text"
                name={name}
                value={socialLinks[name] || ""}
                onChange={handleChange}
                placeholder={
                  name === 'website'
                    ? 'https://yourwebsite.com'
                    : `https://${name}.com`
                }
                className="ml-3 w-full bg-transparent text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-yellow-500"
              />
            </div>
            {errors[name] && (
              <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
            )}
          </div>
        );
      })}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          onClick={onBack}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          onClick={onNext}
          disabled={!isFormValid}
          className={`px-5 py-2 rounded-lg transition flex items-center gap-2 ${
            isFormValid
              ? "bg-yellow-500 text-white hover:bg-yellow-600"
              : "bg-yellow-300 text-white cursor-not-allowed"
          }`}
        >
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default SocialLinks;
