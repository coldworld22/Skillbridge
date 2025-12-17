import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import styles from "@/shared/components/auth/auth.module.scss";
import { resetPassword } from "@/services/auth/authService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const { t } = useTranslation("auth");

  useEffect(() => {

    if (!router.isReady) return; // wait for query params

    const queryEmail = router.query.email;
    const queryCode = router.query.code;
    const storedEmail = localStorage.getItem("otp_verified_email");
    const storedCode = localStorage.getItem("otp_verified_code");


    if (queryEmail && queryCode) {
      localStorage.setItem("otp_verified_email", queryEmail);
      localStorage.setItem("otp_verified_code", queryCode);
      setEmail(queryEmail);
      setCode(queryCode);
    } else if (storedEmail && storedCode) {
      setEmail(storedEmail);
      setCode(storedCode);
    } else {
      toast.error(t("missing_otp_verification"));
      router.replace("/auth/forgot-password");
    }

  }, [router.isReady, router.query]);


  const isStrongPassword =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[\W_]/.test(newPassword);

  const handleResetPassword = async () => {
    if (!isStrongPassword) {
      toast.error(t("password_strength_error"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("passwords_not_match"));
      return;
    }

    try {
      await resetPassword({ email, code, new_password: newPassword });
      toast.success(t("password_reset_successful"));
      router.push("/auth/success-reset");
    } catch (err) {
      const msg = err?.response?.data?.message || t("password_reset_failed");
      toast.error(msg);
    }
  };

  return (
    <div className={styles.authPage}>
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${styles.card} ${styles.compactCard}`}
      >
        <h2 className={styles.title}>{t("reset_password")}</h2>
        <p className={styles.subtitle}>
          {t("reset_password_for")} <span className={styles.link}>{email}</span>
        </p>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>{t("new_password")}</label>
            <div className={styles.inputWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder={t("enter_new_password")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <span className={styles.eyeToggle} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <ul className={styles.list}>
              <li>{newPassword.length >= 8 ? `✔ ${t("at_least_8_characters")}` : `❌ ${t("at_least_8_characters")}`}</li>
              <li>{/[A-Z]/.test(newPassword) ? `✔ ${t("one_uppercase_letter")}` : `❌ ${t("one_uppercase_letter")}`}</li>
              <li>{/[\W_]/.test(newPassword) ? `✔ ${t("one_special_character")}` : `❌ ${t("one_special_character")}`}</li>
            </ul>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>{t("confirm_new_password")}</label>
            <div className={styles.inputWrapper}>
              <input
                type={showConfirm ? "text" : "password"}
                className={styles.input}
                placeholder={t("confirm_new_password")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <span className={styles.eyeToggle} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <motion.button whileHover={{ scale: 1.02 }} onClick={handleResetPassword} className={styles.primaryButton}>
            {t("reset_password")}
          </motion.button>
        </div>
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
