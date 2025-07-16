import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";

const iconMap = { google: FaGoogle, facebook: FaFacebook, apple: FaApple };

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
      <div className="mt-4 text-center text-gray-500 text-sm">or continue with</div>
      <div className="mt-2 flex space-x-4 justify-center">
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
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
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
