// 📁 src/pages/auth/success-reset.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import { useTranslation } from "react-i18next";

export default function SuccessReset() {
  const router = useRouter();
  const { t } = useTranslation("auth");

  useEffect(() => {
    localStorage.removeItem("otp_verified_email");
    localStorage.removeItem("otp_verified_code");

    const timer = setTimeout(() => {
      router.push("/auth/login");
    }, 4000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="mb-4"
        >
          <FaCheckCircle className="text-yellow-500 text-6xl" />
        </motion.div>

        <h2 className="text-2xl font-bold text-yellow-400 mb-4">
          {t('password_reset_successful')}
        </h2>
        <p className="text-gray-400 text-center mb-4">
          {t('password_reset_desc')}
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          className="w-full bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold mt-6"
          onClick={() => router.push("/auth/login")}
        >
          {t('go_to_login')}
        </motion.button>
      </motion.div>
    </div>
  );
}
