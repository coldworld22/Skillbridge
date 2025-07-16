// 📁 src/shared/components/auth/SocialRegister.js
import { useState, useEffect } from "react";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";
import { motion } from "framer-motion";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";

const iconMap = { google: FaGoogle, facebook: FaFacebook, apple: FaApple };
const styleMap = {
  google: "bg-white text-gray-700 hover:bg-gray-100",
  facebook: "bg-[#3b5998] text-white hover:bg-[#314d86]",
  apple: "bg-black text-white hover:bg-gray-800",
};

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
      <div className="flex items-center my-6">
        <hr className="flex-grow border-gray-600" />
        <span className="mx-2 text-gray-400 text-xs uppercase">
          or sign up with
        </span>
        <hr className="flex-grow border-gray-600" />
      </div>
      <div className="flex justify-center gap-3">
        {activeProviders.map(([key, p]) => {
          const Icon = iconMap[p.icon] || iconMap[key] || FaGoogle;
          const handleClick = () => {
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
            window.location.href = `${base}/api/auth/${key}`;
          };
          return (
            <motion.button
              key={key}
              onClick={handleClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                styleMap[key] || "bg-yellow-500 text-white hover:bg-yellow-600"
              }`}
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