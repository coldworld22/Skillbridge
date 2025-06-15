// ───────────────────────────────────────
// 📁 frontend/src/pages/auth/login.js
//  ──────────────────────────────────────
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import Image from "next/image";

import logo from "@/shared/assets/images/login/logo.png";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";
import SocialLogin from "@/shared/components/auth/SocialLogin";
import useAuthStore from "@/store/auth/authStore";

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
      };
      const rolePath = profilePaths[user.role?.toLowerCase()] || "/website";
      router.replace(rolePath);
    } else {
      router.replace("/website");
    }
  }, [hasHydrated, user]);

  // ─────────────────────────────
  // 🔑 Handle form submission
  // ─────────────────────────────
  const onSubmit = async (data) => {
  try {
    const loggedInUser = await login(data);
    toast.success("Login successful");

    const profilePaths = {
      admin: "/dashboard/admin/profile/edit",
      instructor: "/dashboard/instructor/profile/edit",
      student: "/dashboard/student/profile/edit",
    };

    const targetPath =
      loggedInUser.profile_complete === false
        ? profilePaths[loggedInUser.role?.toLowerCase()] || "/website"
        : "/website";

    // ⏳ Delay before redirecting (e.g., 1.2 seconds)
    setTimeout(() => {
      router.push(targetPath);
    }, 1200);
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Login failed. Please try again.";

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
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-gray-900 flex items-center justify-center mb-4 shadow-lg">
          <Image src={logo} alt="SkillBridge Logo" width={80} height={80} priority className="rounded-full" />
        </div>

        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">Welcome to SkillBridge 🎓</h2>

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
            disabled={isSubmitting}
            whileHover={{ scale: 1.05 }}
            className={`w-full mt-6 py-2 rounded-lg font-semibold transition ${isSubmitting
              ? "bg-gray-500 cursor-not-allowed text-white"
              : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              }`}
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </motion.button>
        </form>

        <div className="mt-4 text-center text-gray-500 text-sm">or continue with</div>

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
