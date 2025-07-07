// 📁 src/shared/components/auth/SocialRegister.js
import { useState, useEffect } from "react";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { motion } from "framer-motion";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";

const iconMap = { google: FaGoogle, facebook: FaFacebook, apple: FaApple };

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
      <div className="mt-6 text-center text-gray-400 text-sm">or continue with</div>
      <div className="mt-2 flex space-x-4 w-full justify-center">
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
              className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            >
              <Icon size={28} />
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
