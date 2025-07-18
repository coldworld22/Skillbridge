// 📁 src/pages/auth/register.js
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PhoneInput from "react-phone-number-input";
import 'react-phone-number-input/style.css';

import { API_BASE_URL } from "@/config/config";
import useAppConfigStore from "@/store/appConfigStore";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";
import SocialRegister from "@/shared/components/auth/SocialRegister";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import { registerSchema } from "@/utils/auth/validationSchemas";
import ReCAPTCHA from "react-google-recaptcha";
import { fetchSocialLoginConfig } from "@/services/socialLoginService";

export default function Register() {
  const router = useRouter();
  const { register: registerUser, user, hasHydrated } = useAuthStore();
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const settings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);
  const [recaptchaCfg, setRecaptchaCfg] = useState(null);
  const [cfgLoading, setCfgLoading] = useState(true);
  const recaptchaRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "Student",
    },
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user) router.replace("/website");
  }, [user, hasHydrated]);

  useEffect(() => {
    fetchAppConfig();
  }, [fetchAppConfig]);

  useEffect(() => {
    fetchSocialLoginConfig()
      .then(setRecaptchaCfg)
      .catch(() => {})
      .finally(() => setCfgLoading(false));
  }, []);

  const onSubmit = async (data) => {
    try {
      const { full_name, email, phone, password, role } = data;
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
      await registerUser({
        full_name,
        email,
        phone,
        password,
        role,
        recaptchaToken: token,
      });
      toast.success("Registration successful");
      fetchNotifications();
      router.push("/auth/login");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Registration failed. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl p-8 w-full max-w-md border border-yellow-500/40 text-white flex flex-col items-center"
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
          Create an Account at {settings.appName || 'SkillBridge'} 🎓
        </h2>

        <div className="flex justify-between bg-gray-700 rounded-lg p-2 mb-4 w-full">
          {["Student", "Instructor"].map((type) => (
            <motion.button
              key={type}
              onClick={() => setValue("role", type)}
              whileHover={{ scale: 1.05 }}
              className={`w-1/2 px-3 py-2 text-sm rounded-md font-semibold transition ${watch("role") === type
                ? "bg-yellow-500 text-gray-900"
                : "text-gray-400 hover:bg-gray-600"
                }`}
            >
              {type}
            </motion.button>
          ))}
        </div>

        <InputField label="Full Name" type="text" placeholder="Enter your name" {...register("full_name")} />
        {errors.full_name && <p className="text-xs text-left w-full text-red-400">{errors.full_name.message}</p>}

        <InputField label="Email" type="email" placeholder="Enter your email" {...register("email")} />
        {errors.email && <p className="text-xs text-left w-full text-red-400">{errors.email.message}</p>}

        {/* ✅ Styled Phone Input */}

        <div className="w-full mb-3">
          <label className="block text-sm text-gray-400 mb-1">Phone</label>
          <div className="phone-input-container border border-gray-600 rounded-md bg-gray-700 overflow-hidden">
            <PhoneInput
              international
              value={watch("phone")}
              onChange={(value) => setValue("phone", value)}
              defaultCountry="SA"
              placeholder="Enter phone number"
              className="w-full"
            />
          </div>
          {errors.phone && <p className="text-xs text-left w-full text-red-400">{errors.phone.message}</p>}
        </div>

        {/* ✅ Password */}
        <div className="w-full mb-3">
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white placeholder-gray-400"
              placeholder="Create a password"
              {...register("password")}
            />
            <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
        </div>

        {/* ✅ Confirm Password */}
        <div className="w-full mb-3">
          <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white placeholder-gray-400"
              placeholder="Confirm password"
              {...register("confirmPassword")}
            />
            <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        {/* ✅ Submit Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || (cfgLoading && !recaptchaCfg)}
          className={`w-full mt-4 py-2 rounded-lg font-semibold transition ${
            isSubmitting || (cfgLoading && !recaptchaCfg)
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          }`}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </motion.button>

        {recaptchaCfg?.recaptcha?.active && (
          <ReCAPTCHA
            sitekey={recaptchaCfg.recaptcha.siteKey}
            size="invisible"
            badge="bottomleft"
            ref={recaptchaRef}
          />
        )}

        {/* ✅ Social Login + Footer */}
        <SocialRegister />

        <p className="text-center mt-6 text-gray-400 text-sm">
          Already have an account?{" "}
          <a href="/auth/login" className="text-yellow-400 hover:underline">
            Login
          </a>
        </p>
      </motion.div>
    </div>
  );
}
