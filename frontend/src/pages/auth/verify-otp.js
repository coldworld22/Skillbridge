// 📁 src/pages/auth/verify-otp.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FaCheckCircle } from "react-icons/fa";

import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import styles from "@/shared/components/auth/auth.module.scss";
import { verifyOtpCode, requestPasswordReset } from "@/services/auth/authService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

// ✅ OTP Schema
import { otpSchema as createOtpSchema } from "@/utils/auth/validationSchemas";

export default function VerifyOTP() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [via, setVia] = useState("email");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { t } = useTranslation("auth");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(createOtpSchema(t)),
    defaultValues: { code: "" },
  });

  // ⏱ Countdown for Resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // 🔁 Load email and delivery method from query or storage
  useEffect(() => {
    const fromQuery = router.query.email;
    const fromStorage = localStorage.getItem("otp_email");
    if (fromQuery) setEmail(fromQuery);
    else if (fromStorage) setEmail(fromStorage);
    else {
      toast.error(t("email_not_found_start_reset"));
      router.push("/auth/forgot-password");
    }

    const viaQuery = router.query.via;
    const viaStorage = localStorage.getItem("otp_via");
    if (viaQuery) setVia(viaQuery);
    else if (viaStorage) setVia(viaStorage);
  }, [router.query.email, router.query.via]);

  // ✅ Handle OTP verification
  const onSubmit = async ({ code }) => {
    try {
      const result = await verifyOtpCode({ email, code });
      if (result.valid) {
        toast.success(t("otp_verified_redirecting"));
        localStorage.setItem("otp_verified_email", email);
        localStorage.setItem("otp_verified_code", code);

        setIsVerified(true);
        setTimeout(() => {
          router.push({
            pathname: "/auth/reset-password",
            query: { email, code },
          });
        }, 500);
      } else {
        toast.error(t("wrong_otp_code"));
      }
    } catch (err) {
      const msg = err?.response?.data?.message || t("verification_failed");
      toast.error(msg);
    }
  };

  // 🔁 Handle resend OTP
  const handleResendOTP = async () => {
    try {
      await requestPasswordReset({ email, via });
      toast.success(t("new_otp_sent"));
      setCanResend(false);
      setResendTimer(30);
    } catch (err) {
      toast.error(t("failed_to_resend_otp"));
    }
  };

  return (
    <div className={styles.authPage}>
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`${styles.card} ${styles.compactCard}`}
      >
        {!isVerified ? (
          <>
            <h2 className={styles.title}>{t("verify_otp")}</h2>
            <p className={styles.subtitle}>
              {t("enter_otp_sent")} <span className={styles.link}>{email}</span>
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>{t("otp_code")}</label>
                <motion.input
                  type="text"
                  maxLength="6"
                  placeholder={t("enter_otp")}
                  className={`${styles.input} ${styles.otp}`}
                  {...register("code")}
                />
                {errors.code && <p className={styles.error}>{errors.code.message}</p>}
              </div>

              <motion.button type="submit" whileHover={{ scale: 1.02 }} className={styles.primaryButton}>
                {t("verify_otp")}
              </motion.button>
            </form>

            <div className={styles.resend}>
              {canResend ? (
                <motion.button whileHover={{ scale: 1.02 }} className={styles.link} onClick={handleResendOTP}>
                  {t("resend_otp")}
                </motion.button>
              ) : (
                <p className={styles.smallText}>{t("resend_otp_in", { count: resendTimer })}</p>
              )}
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className={styles.successState}>
            <FaCheckCircle className={styles.successIcon} />
            <h2 className={styles.title}>{t("otp_verified")}</h2>
            <p className={styles.subtitle}>{t("redirecting")}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'auth'], nextI18NextConfig)),
    },
  };
}
