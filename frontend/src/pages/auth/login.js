// ───────────────────────────────────────
// 📁 frontend/src/pages/auth/login.js
//  ──────────────────────────────────────
import { useEffect, useMemo, useState } from "react";
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
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
import Image from "next/image";
import logger from "@/utils/logger";

// ─────────────────────
// 🔐 Validation schema
// ─────────────────────
import { loginSchema as createLoginSchema } from "@/utils/auth/validationSchemas";

function LoginForm({ recaptchaCfg, cfgLoading, setRecaptchaCfg, setCfgLoading }) {
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
    if (!hasHydrated || !user) return;

    if (user.profile_complete === false) {
      const profilePaths = {
        admin: "/dashboard/admin/profile/edit",
        instructor: "/dashboard/instructor/profile/edit",
        student: "/dashboard/student/profile/edit",
        superadmin: "/dashboard/admin/profile/edit",
      };
      const rolePath = profilePaths[user.role?.toLowerCase()] || "/website";
      router.replace(rolePath);
    } else {
      router.replace("/website");
    }
  }, [hasHydrated, user]);

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
      fetchNotifications();

      const profilePaths = {
        admin: "/dashboard/admin/profile/edit",
        instructor: "/dashboard/instructor/profile/edit",
        student: "/dashboard/student/profile/edit",
        superadmin: "/dashboard/admin/profile/edit",
      };

      const targetPath =
        loggedInUser.profile_complete === false
          ? profilePaths[loggedInUser.role?.toLowerCase()] || "/website"
          : "/website";

      // 🚀 Redirect after a short delay so the toast is visible
      setTimeout(() => {
        router.push(targetPath);
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
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 py-12 px-4 sm:px-6">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
        className="relative bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl p-8 sm:p-10 w-full max-w-md border border-yellow-500/40 text-white flex flex-col items-center space-y-6"
      >
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500/80 bg-gray-900 flex items-center justify-center shadow-lg overflow-hidden">
          <Image
            src={logoSrc}
            alt={`${settings.appName || "SkillBridge"} Logo`}
            width={96}
            height={96}
            priority
            className="rounded-full object-contain"
            onError={() => setLogoErrored(true)}
          />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-yellow-400">
            {t("welcome", { appName: settings.appName || "SkillBridge" })}
          </h2>
          <p className="text-sm text-gray-300 max-w-xs">
            {t("signing_you_in")}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          <InputField
            label={t("email")}
            type="email"
            placeholder={t("email")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 w-full text-left">
              {errors.email.message}
            </p>
          )}

          <InputField
            label={t("password")}
            type="password"
            placeholder={t("password")}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 w-full text-left">
              {errors.password.message}
            </p>
          )}

          <div className="flex items-center justify-between w-full text-sm text-gray-300">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" {...register("remember")} />
              {t("remember_me")}
            </label>
            <a href="/auth/forgot-password" className="text-yellow-400 hover:underline">
              {t("forgot_password")}
            </a>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            className={`w-full mt-2 py-3 rounded-lg font-semibold transition ${
              isSubmitting
                ? "bg-gray-500 cursor-not-allowed text-white"
                : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            }`}
          >
            {isSubmitting ? t("logging_in") : t("login")}
          </motion.button>
        </form>

        <SocialLogin />

        <p className="text-center text-gray-300 text-sm">
          {t("dont_have_account")} {" "}
          <a href="/auth/register" className="text-yellow-400 hover:underline">
            {t("sign_up")}
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

  if (recaptchaCfg?.recaptcha?.active) {
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
