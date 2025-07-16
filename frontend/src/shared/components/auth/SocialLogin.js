import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";

const iconMap = { google: FaGoogle, facebook: FaFacebook, apple: FaApple };
const styleMap = {
  google: "bg-white text-gray-700 hover:bg-gray-100 border-gray-300",
  facebook: "bg-[#3b5998] text-white hover:bg-[#314d86] border-transparent",
  apple: "bg-black text-white hover:bg-gray-800 border-transparent",
};

export default function SocialLogin() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchSocialLoginConfig().then(setConfig).catch(() => {});
  }, []);

  if (!config?.enabled) return null;

  const activeProviders = Object.entries(config.providers || {}).filter(([, p]) => p.active);
  if (activeProviders.length === 0) return null;

  return (
    <>
      <div className="flex items-center mt-6 mb-4">
        <hr className="flex-grow border-gray-600" />
        <span className="mx-3 text-gray-500 text-xs uppercase">or continue with</span>
        <hr className="flex-grow border-gray-600" />
      </div>
      <div className="flex justify-center gap-4">
        {activeProviders.map(([key, p]) => {
          const Icon = iconMap[p.icon] || iconMap[key] || FaGoogle;
          const handleClick = () => {
            // Default to a relative path when NEXT_PUBLIC_API_BASE_URL isn't set
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            window.location.href = `${base}/api/auth/${key}`;
          };
          return (
            <motion.button
              key={key}
              onClick={handleClick}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border shadow-md transition-colors ${styleMap[key] || "bg-yellow-500 text-white hover:bg-yellow-600 border-transparent"}`}
            >
              <Icon size={20} />
              <span className="hidden sm:block">{p.label || key}</span>
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
