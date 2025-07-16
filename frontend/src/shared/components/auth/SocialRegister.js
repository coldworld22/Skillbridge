// 📁 src/shared/components/auth/SocialRegister.js
import { useState, useEffect } from "react";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { motion } from "framer-motion";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";

const iconMap = { google: FaGoogle, facebook: FaFacebook, apple: FaApple };
const styleMap = {
  google: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100",
  facebook: "bg-[#3b5998] text-white hover:bg-[#314d86]",
  apple: "bg-black text-white hover:bg-gray-800",
};

export default function SocialRegister() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchSocialLoginConfig().then(setConfig).catch(() => {});
  }, []);

  if (!config?.enabled) return null;

  const activeProviders = Object.entries(config.providers || {}).filter(([, p]) => p.active);
  if (activeProviders.length === 0) return null;

  return (
    <>
      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-600" />
        <span className="mx-2 text-gray-400 text-xs uppercase">or continue with</span>
        <hr className="flex-grow border-gray-600" />
      </div>
      <div className="mt-2 flex space-x-3 w-full justify-center">
        {activeProviders.map(([key, p]) => {
          const Icon = iconMap[p.icon] || iconMap[key] || FaGoogle;
          const handleClick = () => {
            // Default to relative path when API base URL isn't specified
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            window.location.href = `${base}/api/auth/${key}`;
          };
          return (
            <motion.button
              key={key}
              onClick={handleClick}
              whileHover={{ scale: 1.1 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 ${styleMap[key] || "bg-yellow-500 text-white hover:bg-yellow-600"}`}
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
