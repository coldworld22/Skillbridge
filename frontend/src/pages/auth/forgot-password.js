import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import styles from "@/shared/components/auth/auth.module.scss";
import * as authService from "@/services/auth/authService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendViaSms, setSendViaSms] = useState(false);
  const router = useRouter();
  const { t } = useTranslation("auth");

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendOTP = async () => {
    if (!isValidEmail) {
      toast.error(t("please_enter_valid_email"));
      return;
    }

    setIsSubmitting(true);
    try {
      const via = sendViaSms ? "sms" : "email";
      await authService.requestPasswordReset({ email, via });
      toast.success(t("otp_sent_success"));
      localStorage.setItem("otp_email", email);
      localStorage.setItem("otp_via", via);
      router.push({ pathname: "/auth/verify-otp", query: { email, via } });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || "";

      if (status === 404 || message.toLowerCase().includes("not found")) {
        toast.error(t("account_not_found_register"));
      } else {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          t("failed_to_send_otp");
        toast.error(msg);
      }

    } finally {
      setIsSubmitting(false);
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
        <h2 className={styles.title}>{t("forgot_password_title")}</h2>
        <p className={styles.subtitle}>{t("forgot_password_desc")}</p>

        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.field}>
            <label className={styles.label}>{t("email")}</label>
            <input
              type="email"
              className={styles.input}
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel} htmlFor="viaSms">
              <input
                id="viaSms"
                type="checkbox"
                className={styles.checkbox}
                checked={sendViaSms}
                onChange={(e) => setSendViaSms(e.target.checked)}
              />
              {t("send_via_sms", "Send via SMS (if phone verified)")}
            </label>
          </div>

          <motion.button
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            type="button"
            disabled={isSubmitting}
            className={styles.primaryButton}
            onClick={handleSendOTP}
          >
            {isSubmitting ? t("sending") : t("send_otp")}
          </motion.button>
        </form>
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
