import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import * as authService from "@/services/auth/authService";
import { useTranslation } from "next-i18next";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("auth");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = async () => {
    if (!isValidEmail) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.requestPasswordReset(email);
      toast.success("OTP sent successfully!");
      localStorage.setItem("otp_email", email);
      router.push({ pathname: "/auth/verify-otp", query: { email } });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "";

      if (status === 404 || message.toLowerCase().includes("not found")) {
        toast.error("Account not found. Please register first.");
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Failed to send OTP.";
        toast.error(msg);
      }

    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        <h2 className="text-2xl font-bold text-yellow-400 mb-6">{t('forgot_password_title')}</h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          {t('forgot_password_desc')}
        </p>

        {/* Email Input */}
        <div className="w-full mb-4">
          <label className="block text-gray-400">{t('email')}</label>
          <input
            type="email"
            className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Send OTP Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          disabled={isSubmitting}
          className={`w-full py-2 rounded-lg font-semibold transition ${isSubmitting ? "bg-gray-500 cursor-not-allowed text-white" : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"}`}
          onClick={handleSendOTP}
        >
          {isSubmitting ? t('sending') : t('send_otp')}
        </motion.button>
      </motion.div>
    </div>
  );
}