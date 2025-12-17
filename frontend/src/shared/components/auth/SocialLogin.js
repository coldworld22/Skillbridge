import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaFacebook, FaApple, FaGithub } from "react-icons/fa";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";
import { API_BASE_URL } from "@/config/config";
import styles from "./auth.module.scss";

const iconMap = { google: FaGoogle, facebook: FaFacebook, apple: FaApple, github: FaGithub };
export default function SocialLogin({ redirectPath = null }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetchSocialLoginConfig().then(setConfig).catch(() => {});
  }, []);

  if (!config?.enabled) return null;

  const activeProviders = Object.entries(config.providers || {}).filter(([, p]) => p.active);
  if (activeProviders.length === 0) return null;

  return (
    <>
      <div className={styles.socialRow}>
        {activeProviders.map(([key, p]) => {
          const Icon = iconMap[p.icon] || iconMap[key] || FaGoogle;
          const handleClick = () => {
            // Align with API service defaulting to '/api' when env is missing
            const base = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
            const origin = window.location.origin;
            const params = new URLSearchParams({ origin });
            if (redirectPath) {
              params.append("redirect", redirectPath);
            }
            const url = `${base}/auth/${key}?${params.toString()}`;
            window.location.href = url;
          };
          return (
            <motion.button
              key={key}
              onClick={handleClick}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              className={styles.socialButton}
            >
              <Icon size={20} />
            </motion.button>
          );
        })}
      </div>
    </>
  );
}
