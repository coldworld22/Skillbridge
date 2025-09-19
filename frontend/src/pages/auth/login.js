// ───────────────────────────────────────
// 📁 frontend/src/pages/auth/login.js
//  ──────────────────────────────────────
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

import { API_BASE_URL } from "@/config/config";
import useAppConfigStore from "@/store/appConfigStore";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";
import SocialLogin from "@/shared/components/auth/SocialLogin";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';
import logger from "@/utils/logger";
import { handleError } from "@/utils/error";

// ─────────────────────
// 🔐 Validation schema
// ─────────────────────
import { loginSchema as createLoginSchema } from "@/utils/auth/validationSchemas";
import { isTokenExpired } from "@/utils/auth/tokenUtils";
import profileRoutes from "@/constants/profileRoutes";

function LoginForm({ recaptchaCfg, cfgLoading, setRecaptchaCfg, setCfgLoading }) {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const settings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);
  const { executeRecaptcha } = useGoogleReCaptcha() || {};

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
    },
  });

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user || !accessToken || isTokenExpired(accessToken)) {
      logout(true);
      return;
    }

    if (user.profile_complete === false) {
      const rolePath = profileRoutes[user.role?.toLowerCase()] || "/website";
      router.replace(rolePath);
    } else {
      router.replace("/website");
    }
  }, [hasHydrated, user, accessToken, logout]);

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
        setCfgLoading(true);
        cfg = await fetchSocialLoginConfig().catch(() => null);
        setRecaptchaCfg(cfg);
        setCfgLoading(false);
      }

      const recaptchaConfigured = Boolean(
        cfg?.recaptcha?.active &&
          cfg?.recaptcha?.siteKey &&
          executeRecaptcha
      );

      let shouldBypassRecaptcha = Boolean(
        cfg?.recaptcha?.active && !recaptchaConfigured
      );

      if (cfg?.recaptcha?.active && !cfg?.recaptcha?.siteKey) {
        logger.warn("⚠️ reCAPTCHA enabled without a site key – skipping");
      }

      let token;
      if (recaptchaConfigured) {
        try {
          token = await executeRecaptcha("login");
          if (!token) {
            shouldBypassRecaptcha = Boolean(cfg?.recaptcha?.active);
          }
        } catch (recaptchaErr) {
          shouldBypassRecaptcha = Boolean(cfg?.recaptcha?.active);
          logger.warn("⚠️ Failed to execute reCAPTCHA, proceeding without token", recaptchaErr);
        }
      }

      if (shouldBypassRecaptcha) {
        logger.warn("⚠️ Bypassing reCAPTCHA for login so the request can proceed");
      }

      const loggedInUser = await login({
        ...data,
        recaptchaToken: token,
        recaptchaBypass: shouldBypassRecaptcha,
      });
      toast.success(t("login_successful"));
      fetchNotifications();

      const targetPath =
        loggedInUser.profile_complete === false
          ? profileRoutes[loggedInUser.role?.toLowerCase()] || "/website"
          : "/website";

      // 🚀 Redirect after a short delay so the toast is visible
      setTimeout(() => {
        router.push(targetPath);
      }, 500);
    } catch (err) {
      logger.error("❌ login onSubmit error", err);
      handleError(err, t("login_failed"));
      setValue("password", "");
      document.activeElement?.blur();

      setTimeout(() => {
        const loginBtn = document.querySelector("button[type=submit]");
        loginBtn?.blur();
      }, 100);
    }
  };




  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-700 text-white flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-gray-900 flex items-center justify-center mb-4 shadow-lg overflow-hidden">

          <img

            src={settings.logo_url
              ? `${API_BASE_URL}${settings.logo_url}`
              : "/images/logo.png"}
            alt={(settings.appName || 'SkillBridge') + ' Logo'}
            width={80}
            height={80}
            className="rounded-full object-contain"
          />
        </div>
        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">
          {t('welcome', { appName: settings.appName || 'SkillBridge' })}
        </h2>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <InputField
            label={t('email')}
            type="email"
            placeholder={t('email')}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 w-full text-left">
              {errors.email.message}
            </p>
          )}

          <InputField
            label={t('password')}
            type="password"
            placeholder={t('password')}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 w-full text-left">
              {errors.password.message}
            </p>
          )}

          <div className="mt-4 flex items-center justify-end w-full text-sm text-gray-400">
            <a href="/auth/forgot-password" className="text-yellow-400 hover:underline">
              {t('forgot_password')}
            </a>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            className={`w-full mt-6 py-2 rounded-lg font-semibold transition ${
              isSubmitting
                ? "bg-gray-500 cursor-not-allowed text-white"
                : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            }`}
          >
            {isSubmitting ? t('logging_in') : t('login')}
          </motion.button>
        </form>

        <SocialLogin />


        <p className="text-center mt-6 text-gray-400 text-sm">
          {t('dont_have_account')} {" "}
          <a href="/auth/register" className="text-yellow-400 hover:underline">
            {t('sign_up')}
          </a>
        </p>
      </motion.div>

    </div>
  );
}

export default function Login() {
  const [recaptchaCfg, setRecaptchaCfg] = useState(null);
  const [cfgLoading, setCfgLoading] = useState(true);

  useEffect(() => {
    fetchSocialLoginConfig()
      .then(setRecaptchaCfg)
      .catch(() => {})
      .finally(() => setCfgLoading(false));
  }, []);

  const recaptchaEnabled = Boolean(
    recaptchaCfg?.recaptcha?.active && recaptchaCfg?.recaptcha?.siteKey
  );

  if (recaptchaEnabled) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaCfg.recaptcha.siteKey}>
        <LoginForm
          recaptchaCfg={recaptchaCfg}
          cfgLoading={cfgLoading}
          setRecaptchaCfg={setRecaptchaCfg}
          setCfgLoading={setCfgLoading}
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
    />
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'auth'], nextI18NextConfig)),
    },
  };
}
