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
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 px-4 py-10 text-white">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-yellow-500/40 bg-gray-900/90 p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-yellow-500 bg-gray-950 shadow-lg">
          <Image
            src={logoSrc}
            alt={`${settings.appName || "SkillBridge"} Logo`}
            width={96}
            height={96}
            className="h-20 w-20 rounded-full object-cover"
            priority
            onError={() => setLogoErrored(true)}
          />
        </div>

        <motion.h2
          layout
          className="mt-6 text-center text-2xl font-bold text-yellow-400"
        >
          {t("welcome", { appName: settings.appName || "SkillBridge" })}
        </motion.h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          {t("signing_you_in")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <InputField
            label={t("email")}
            type="email"
            placeholder={t("email")}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-left text-xs text-red-400">
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
            <p className="text-left text-xs text-red-400">
              {errors.password.message}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-gray-300">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
                {...register("remember")}
              />
              {t("remember_me")}
            </label>
            <Link
              href="/auth/forgot-password"
              className="font-medium text-yellow-400 transition hover:text-yellow-300"
            >
              {t("forgot_password")}
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className={`w-full rounded-lg bg-yellow-500 py-2 font-semibold text-gray-900 shadow-lg shadow-yellow-500/30 transition focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
              isSubmitting ? "cursor-not-allowed opacity-70" : "hover:bg-yellow-400"
            }`}
          >
            {isSubmitting ? t("logging_in") : t("login")}
          </motion.button>
        </form>

        <div className="mt-6">
          <div className="flex items-center gap-4 text-gray-500">
            <span className="h-px flex-1 bg-gray-700" aria-hidden />
            <span className="text-xs uppercase tracking-[0.3em]">
              {t("or", { defaultValue: "Or" })}
            </span>
            <span className="h-px flex-1 bg-gray-700" aria-hidden />
          </div>
          <SocialLogin />
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          {t("dont_have_account")}{" "}
          <Link href="/auth/register" className="font-medium text-yellow-400 transition hover:text-yellow-300">
            {t("sign_up")}
          </Link>
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
