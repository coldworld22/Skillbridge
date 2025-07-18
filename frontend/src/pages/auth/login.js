// ───────────────────────────────────────
// 📁 frontend/src/pages/auth/login.js
//  ──────────────────────────────────────
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

import { API_BASE_URL } from "@/config/config";
import useAppConfigStore from "@/store/appConfigStore";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";
import SocialLogin from "@/shared/components/auth/SocialLogin";
import ReCAPTCHA from "react-google-recaptcha";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";

// ─────────────────────
// 🔐 Validation schema
// ─────────────────────
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password is required" }),
  remember: z.boolean().optional(),
});

export default function Login() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const settings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);
  const [recaptchaCfg, setRecaptchaCfg] = useState(null);
  const [cfgLoading, setCfgLoading] = useState(true);
  const recaptchaRef = useRef(null);

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
    resolver: zodResolver(loginSchema),
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

  useEffect(() => {
    fetchSocialLoginConfig()
      .then(setRecaptchaCfg)
      .catch(() => {})
      .finally(() => setCfgLoading(false));
  }, []);

  // ─────────────────────────────
  // 🔑 Handle form submission
  // ─────────────────────────────
  const onSubmit = async (data) => {
  try {
    console.log("➡️ login onSubmit", data.email);
    let cfg = recaptchaCfg;
    if (!cfg && cfgLoading) {
      cfg = await fetchSocialLoginConfig().catch(() => null);
      setRecaptchaCfg(cfg);
      setCfgLoading(false);
    }
    let token;
    if (cfg?.recaptcha?.active && recaptchaRef.current) {
      token = await recaptchaRef.current.executeAsync();
      recaptchaRef.current.reset();
    }
    const loggedInUser = await login({ ...data, recaptchaToken: token });
    toast.success("Login successful");
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
    console.error("❌ login onSubmit error", err);
    let msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Login failed. Please try again.";

    if (err.code === "ERR_NETWORK") {
      msg =
        "Network error: check NEXT_PUBLIC_API_BASE_URL and backend CORS settings.";
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
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
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
          Welcome to {settings.appName || 'SkillBridge'} 🎓
        </h2>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <InputField
            label="Email"
            type="email"
            placeholder="Enter your email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 w-full text-left">
              {errors.email.message}
            </p>
          )}

          <InputField
            label="Password"
            type="password"
            placeholder="Enter your password"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 w-full text-left">
              {errors.password.message}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between w-full text-sm text-gray-400">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" {...register("remember")} />
              Remember Me
            </label>
            <a href="/auth/forgot-password" className="text-yellow-400 hover:underline">
              Forgot Password?
            </a>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting || (cfgLoading && !recaptchaCfg)}
            whileHover={{ scale: 1.05 }}
            className={`w-full mt-6 py-2 rounded-lg font-semibold transition ${
              isSubmitting || (cfgLoading && !recaptchaCfg)
                ? "bg-gray-500 cursor-not-allowed text-white"
                : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            }`}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </motion.button>
        </form>

        {recaptchaCfg?.recaptcha?.active && (
          <ReCAPTCHA
            sitekey={recaptchaCfg.recaptcha.siteKey}
            size="invisible"
            badge="bottomleft"
            ref={recaptchaRef}
          />
        )}

        <SocialLogin />

        <p className="text-center mt-6 text-gray-400 text-sm">
          Don't have an account?{" "}
          <a href="/auth/register" className="text-yellow-400 hover:underline">
            Sign Up
          </a>
        </p>
      </motion.div>
    </div>
  );
}
