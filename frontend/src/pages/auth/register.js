// 📁 src/pages/auth/register.js
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import PhoneInput from "react-phone-number-input";
import 'react-phone-number-input/style.css';

import logo from "@/shared/assets/images/login/logo.png";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";
import SocialRegister from "@/shared/components/auth/SocialRegister";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import { registerSchema } from "@/utils/auth/validationSchemas";

export default function Register() {
  const router = useRouter();
  const { register: registerUser, user, hasHydrated } = useAuthStore();
  const fetchNotifications = useNotificationStore((state) => state.fetch);

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

  const onSubmit = async (data) => {
    try {
      const { full_name, email, phone, password, role } = data;
      await registerUser({ full_name, email, phone, password, role });
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
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-gray-900 flex items-center justify-center mb-4 shadow-lg">
          <Image src={logo} alt="SkillBridge Logo" width={80} height={80} className="rounded-full" priority />
        </div>

        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">
          Create an Account 🎓
        </h2>

        <div className="flex justify-between bg-gray-700 rounded-lg p-2 mb-4 w-full">
          {["Student", "Instructor"].map((type) => (
            <motion.button
              key={type}
              onClick={() => setValue("role", type)}
              whileHover={{ scale: 1.05 }}
              className={`w-1/2 px-3 py-2 text-sm rounded-md font-semibold transition ${
                watch("role") === type
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
          <PhoneInput
            value={watch("phone")}
            onChange={(val) => setValue("phone", val)}
            defaultCountry="SA"
            className="!w-full !px-3 !py-2 !bg-gray-700 !text-white !border !border-gray-600 !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-yellow-500"
          />
          {errors.phone && <p className="text-xs text-left w-full text-red-400">{errors.phone.message}</p>}
        </div>

        {/* ✅ Password */}
        <div className="w-full mb-3">
          <label className="block text-sm text-gray-400 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white"
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
              className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white"
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
          disabled={isSubmitting}
          className={`w-full mt-4 py-2 rounded-lg font-semibold transition ${
            isSubmitting
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
          }`}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </motion.button>

        {/* ✅ Social Login + Footer */}
        <div className="mt-6 text-center text-gray-400 text-sm">or continue with</div>
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
