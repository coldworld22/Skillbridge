// 📁 src/shared/components/auth/SocialRegister.js
import { useState, useEffect } from "react";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { motion } from "framer-motion";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";
import { API_BASE_URL } from "@/config/config";

const iconMap = { google: FaGoogle, facebook: FaFacebook, apple: FaApple };
const unifiedButtonStyle =
  "w-12 h-12 flex items-center justify-center rounded-full bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400";

export default function SocialRegister() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchSocialLoginConfig().then(setConfig).catch(() => {});
  }, []);

  if (!config?.enabled) return null;

  const activeProviders = Object.entries(config.providers || {}).filter(
    ([, p]) => p.active
  );
  if (activeProviders.length === 0) return null;

  return (
    <>
      <div className="flex justify-center gap-4 mt-6">
        {activeProviders.map(([key, p]) => {
          const Icon = iconMap[p.icon] || iconMap[key] || FaGoogle;
          const handleClick = () => {
            // Align with API service defaulting to '/api' when env is missing
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
            const origin = window.location.origin;
            const url = `${base}/auth/${key}?origin=${encodeURIComponent(origin)}`;
            window.location.href = url;
          };
          return (
            <motion.button
              key={key}
              onClick={handleClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={unifiedButtonStyle}
              aria-label={`Sign up with ${p.label || key}`}
            >
              <Icon size={20} />
            </motion.button>
          );
        })}
      </div>
    </>
  );
}