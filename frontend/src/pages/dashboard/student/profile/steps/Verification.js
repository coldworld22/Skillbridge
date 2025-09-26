
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { FaArrowLeft, FaCheckCircle, FaEnvelope, FaPhone } from "react-icons/fa";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import {
  sendEmailOtp,
  sendPhoneOtp,
  confirmEmailOtp,
  confirmPhoneOtp,
} from "@/services/verificationService";
import StudentLayout from "@/components/layouts/StudentLayout";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";


const Verification = ({ prevStep = () => {} }) => {
  const router = useRouter();
  const { t } = useTranslation("dashboard");

  const { user, refreshUser } = useAuthStore();
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);
  const [emailVerified, setEmailVerified] = useState(user?.is_email_verified || false);
  const [phoneVerified, setPhoneVerified] = useState(user?.is_phone_verified || false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });

  // Redirect immediately if already verified
  useEffect(() => {
    if (emailVerified && phoneVerified) {
      toast.success(t("studentVerificationStep.feedback.bothVerified"));
      const timeout = setTimeout(() => router.push("/dashboard/student"), 1500);
      return () => clearTimeout(timeout);
    }
  }, [emailVerified, phoneVerified, router, t]);

  const sendOtp = async (type) => {
    try {
      const res = type === "email" ? await sendEmailOtp() : await sendPhoneOtp();
      if (res.verified) {
        type === "email" ? setEmailVerified(true) : setPhoneVerified(true);
        toast.info(
          t(
            `studentVerificationStep.feedback.${
              type === "email" ? "email" : "phone"
            }AlreadyVerified`
          )
        );
        return;
      }
      setOtpSent((prev) => ({ ...prev, [type]: true }));
      toast.success(t("studentVerificationStep.feedback.otpSent"));
    } catch (err) {
      toast.error(t("studentVerificationStep.feedback.sendOtpFailed"));
    }
  };

  const verifyOtp = async (type) => {
    const enteredOTP = type === "email" ? emailOTP : phoneOTP;
    try {
      const res =
        type === "email"
          ? await confirmEmailOtp(enteredOTP)
          : await confirmPhoneOtp(enteredOTP);
      if (res.alreadyVerified) {
        toast.info(
          t(
            `studentVerificationStep.feedback.${
              type === "email" ? "email" : "phone"
            }AlreadyVerified`
          )
        );
      } else {
        toast.success(
          t(
            `studentVerificationStep.feedback.${
              type === "email" ? "email" : "phone"
            }Verified`
          )
        );
      }

      if (type === "email") setEmailVerified(true);
      if (type === "phone") setPhoneVerified(true);

      await refreshUser();
      refreshNotifications?.();
      refreshMessages?.();

      try {
        const message = t(
          `studentVerificationStep.messages.${
            type === "email" ? "email" : "phone"
          }Verified`
        );
        await createNotification({
          user_id: user.id,
          type: "verification",
          message,
        });
        await sendChatMessage(user.id, { text: message });
        refreshNotifications?.();
        refreshMessages?.();
      } catch (notifyErr) {
        console.error(notifyErr);
      }

      const emailNow = type === "email" ? true : emailVerified;
      const phoneNow = type === "phone" ? true : phoneVerified;
      if (emailNow && phoneNow) {
        toast.success(t("studentVerificationStep.feedback.bothVerified"));
        setTimeout(() => router.push("/dashboard/student"), 1500);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        t("studentVerificationStep.feedback.invalidOrExpiredOtp");
      toast.error(msg);
    }
  };

  // No identity document upload required

  return (
    <StudentLayout>
      <motion.div
        className="p-6 bg-white text-gray-800 rounded-3xl shadow-xl border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-yellow-600">
          {t("studentVerificationStep.title")}
        </h2>

        {/* Email Verification */}
        <div className="mb-4">
          <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
            <FaEnvelope className="text-yellow-500 text-lg" />
            <span className="font-medium">
              {t("studentVerificationStep.emailSection.label")}
            </span>
            {emailVerified ? (
              <span className="text-green-600 flex items-center gap-1">
                <FaCheckCircle /> {t("studentVerificationStep.common.verified")}
              </span>
            ) : otpSent.email ? (
              <span className="text-sm">
                {t("studentVerificationStep.common.otpSent")}
              </span>
            ) : (
              <button
                onClick={() => sendOtp("email")}
                className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition"
              >
                {t("studentVerificationStep.actions.sendOtp")}
              </button>
            )}
          </div>

          {/* Email OTP Input */}
          {!emailVerified && otpSent.email && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder={t("studentVerificationStep.emailSection.placeholder")}
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <button
                onClick={() => verifyOtp("email")}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {t("studentVerificationStep.actions.verify")}
              </button>
            </div>
          )}
        </div>

        {/* Phone Verification */}
        <div className="mb-4">
          <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
            <FaPhone className="text-yellow-500 text-lg" />
            <span className="font-medium">
              {t("studentVerificationStep.phoneSection.label")}
            </span>
            {phoneVerified ? (
              <span className="text-green-600 flex items-center gap-1">
                <FaCheckCircle /> {t("studentVerificationStep.common.verified")}
              </span>
            ) : otpSent.phone ? (
              <span className="text-sm">
                {t("studentVerificationStep.common.otpSent")}
              </span>
            ) : (
              <button
                onClick={() => sendOtp("phone")}
                className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition"
              >
                {t("studentVerificationStep.actions.sendOtp")}
              </button>
            )}
          </div>

          {/* Phone OTP Input */}
          {!phoneVerified && otpSent.phone && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder={t("studentVerificationStep.phoneSection.placeholder")}
                value={phoneOTP}
                onChange={(e) => setPhoneOTP(e.target.value)}
                className="w-full px-3 py-2 border rounded mb-2"
              />
              <p className="text-xs text-gray-500">
                {t("studentVerificationStep.phoneSection.defaultOtp")} <code>123456</code>
              </p>
              <button
                onClick={() => verifyOtp("phone")}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                {t("studentVerificationStep.actions.verify")}
              </button>
            </div>
          )}
        </div>


        {/* Navigation */}
        <div className="flex justify-start mt-6">
          <button
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            onClick={prevStep}
          >
            <FaArrowLeft /> {t("back")}
          </button>

        </div>
      </motion.div>
    </StudentLayout>

  );
};

export default Verification;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard", "common"],
        nextI18NextConfig
      )),
    },
  };
}
