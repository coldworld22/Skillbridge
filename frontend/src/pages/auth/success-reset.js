// 📁 src/pages/auth/success-reset.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import styles from "@/shared/components/auth/auth.module.scss";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

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
    <div className={styles.authPage}>
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`${styles.card} ${styles.compactCard}`}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1.05 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className={styles.successState}
        >
          <FaCheckCircle className={styles.successIcon} />
        </motion.div>

        <h2 className={styles.title}>{t("password_reset_successful")}</h2>
        <p className={styles.subtitle}>{t("password_reset_desc")}</p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          className={styles.primaryButton}
          onClick={() => router.push("/auth/login")}
        >
          {t("go_to_login")}
        </motion.button>
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
