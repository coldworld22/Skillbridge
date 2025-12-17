// ───────────────────────────────────────
// 📁 frontend/src/pages/auth/login.js
//  ──────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

import { API_BASE_URL } from "@/config/config";
import useAppConfigStore from "@/store/appConfigStore";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";
import SocialLogin from "@/shared/components/auth/SocialLogin";
import styles from "@/shared/components/auth/auth.module.scss";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
import logger from "@/utils/logger";
import { getPostLoginDestination, sanitizeRedirectPath } from "@/utils/auth/postLoginRedirect";

// ─────────────────────
// 🔐 Validation schema
// ─────────────────────
import { loginSchema as createLoginSchema } from "@/utils/auth/validationSchemas";

function LoginForm({ recaptchaCfg, cfgLoading, setRecaptchaCfg, setCfgLoading, redirectPath }) {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const settings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);
  const { executeRecaptcha } = useGoogleReCaptcha() || {};
  const [logoErrored, setLogoErrored] = useState(false);

  const logoSrc = useMemo(() => {
    if (logoErrored) return "/images/logo.png";
    if (settings.logo_url) {
      return `${API_BASE_URL}${settings.logo_url}`;
    }
    return "/images/logo.png";
  }, [logoErrored, settings.logo_url]);

  // ─────────────────────
  // 📝 Form setup
  // ─────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    reset
  } = useForm({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: {
      email: "",
      password: "",
      remember: true,
    },
  });

  useEffect(() => {
    if (!router.isReady || !hasHydrated || !user) return;
    const destination = getPostLoginDestination({ user, redirectPath });
    router.replace(destination);
  }, [router.isReady, hasHydrated, user, redirectPath, router]);

  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

  // ─────────────────────────────
  // 🔑 Handle form submission
  // ─────────────────────────────
  const onSubmit = async (data) => {
    try {
      logger.log("➡️ login onSubmit invoked");
      let cfg = recaptchaCfg;
      if (!cfg && cfgLoading) {
        cfg = await fetchSocialLoginConfig().catch(() => null);
        setRecaptchaCfg(cfg);
        setCfgLoading(false);
      }
      let token;
      if (cfg?.recaptcha?.active && executeRecaptcha) {
        token = await executeRecaptcha("login");
      }
      const loggedInUser = await login({ ...data, recaptchaToken: token });
      toast.success(t("login_successful"));
      if (loggedInUser.profile_complete && loggedInUser.is_email_verified) {
        fetchNotifications();
      }

      const destination = getPostLoginDestination({
        user: loggedInUser,
        redirectPath,
      });

      // 🚀 Redirect after a short delay so the toast is visible
      setTimeout(() => {
        router.push(destination);
      }, 500);
    } catch (err) {
      logger.error("❌ login onSubmit error", { message: err?.message });
      let msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("login_failed");

      if (msg === "Invalid credentials") {
        msg = t("invalid_credentials");
      }

      if (err.code === "ERR_NETWORK") {
        msg = t("network_error_check_config");
      }

      toast.error(msg);
      setValue("password", "");
      document.activeElement?.blur();

      setTimeout(() => {
        const loginBtn = document.querySelector("button[type=submit]");
        loginBtn?.blur();
      }, 100);
    }
  };




  return (
    <div className={styles.authPage}>
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={styles.card}
      >
        <div className={styles.logoRing}>
          <Image
            src={logoSrc}
            alt={`${settings.appName || "SkillBridge"} Logo`}
            width={96}
            height={96}
            className={styles.logoImg}
            priority
            onError={() => setLogoErrored(true)}
          />
        </div>

        <motion.h2 layout className={styles.title}>
          {t("welcome", { appName: settings.appName || "SkillBridge" })}
        </motion.h2>
        <p className={styles.subtitle}>{t("signing_you_in")}</p>

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          <InputField
            label={t("email")}
            type="email"
            placeholder={t("email")}
            {...register("email")}
          />
          {errors.email && <p className={styles.error}>{errors.email.message}</p>}

          <InputField
            label={t("password")}
            type="password"
            placeholder={t("password")}
            {...register("password")}
          />
          {errors.password && <p className={styles.error}>{errors.password.message}</p>}

          <div className={styles.checkboxRow}>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} {...register("remember")} />
              {t("remember_me")}
            </label>
            <Link href="/auth/forgot-password" className={styles.link}>
              {t("forgot_password")}
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className={styles.primaryButton}
          >
            {isSubmitting ? t("logging_in") : t("login")}
          </motion.button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerLine} aria-hidden />
          <span className={styles.dividerLabel}>{t("or", { defaultValue: "Or" })}</span>
          <span className={styles.dividerLine} aria-hidden />
        </div>
        <SocialLogin redirectPath={redirectPath} />

        <p className={`${styles.helper} ${styles.smallText}`}>
          {t("dont_have_account")}{" "}
          <Link href="/auth/register" className={styles.link}>
            {t("sign_up")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [recaptchaCfg, setRecaptchaCfg] = useState(null);
  const [cfgLoading, setCfgLoading] = useState(true);
  const redirectPath = useMemo(() => {
    if (!router.isReady) return null;
    const raw = router.query.redirect ?? router.query.next;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return sanitizeRedirectPath(value);
  }, [router.isReady, router.query.redirect, router.query.next]);

  useEffect(() => {
    fetchSocialLoginConfig()
      .then(setRecaptchaCfg)
      .catch(() => {})
      .finally(() => setCfgLoading(false));
  }, []);

  if (recaptchaCfg?.recaptcha?.active) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaCfg.recaptcha.siteKey}>
        <LoginForm
          recaptchaCfg={recaptchaCfg}
          cfgLoading={cfgLoading}
          setRecaptchaCfg={setRecaptchaCfg}
          setCfgLoading={setCfgLoading}
          redirectPath={redirectPath}
        />
      </GoogleReCaptchaProvider>
    );
  }

  return (
    <LoginForm
      recaptchaCfg={recaptchaCfg}
      cfgLoading={cfgLoading}
      setRecaptchaCfg={setRecaptchaCfg}
      setCfgLoading={setCfgLoading}
      redirectPath={redirectPath}
    />
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'auth'], nextI18NextConfig)),
    },
  };
}
