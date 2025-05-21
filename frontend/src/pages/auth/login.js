import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";

import logo from "@/shared/assets/images/login/logo.png";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";
import SocialLogin from "@/shared/components/auth/SocialLogin";
import useAuthStore from "@/store/auth/authStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const { user, login, hasHydrated } = useAuthStore();
  const router = useRouter();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Check auth state and redirect if needed
  useEffect(() => {
    if (!hasHydrated) return;

    if (user) {
      router.replace("/website");
    } else {
      setIsCheckingAuth(false);
    }
  }, [user, hasHydrated, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Email and password are required.");
      return;
    }

    if (!isEmailValid) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password }, remember);
      toast.success("Login successful");
      router.push("/website");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasHydrated || isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }


  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: 1.03,
          boxShadow: "0px 10px 30px rgba(234, 179, 8, 0.2)",
        }}
        transition={{ duration: 0.3 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-gray-900 flex items-center justify-center mb-4 shadow-lg">
          <Image
            src={logo}
            alt="SkillBridge Logo"
            width={80}
            height={80}
            priority
            className="rounded-full"
          />
        </div>

        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">
          Welcome to SkillBridge 🎓
        </h2>

        <InputField
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {email && !isEmailValid && (
          <p className="text-red-500 text-xs mt-1 w-full text-left">
            Please enter a valid email address.
          </p>
        )}

        <InputField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <div className="mt-4 flex items-center justify-between w-full text-sm text-gray-400">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember Me
          </label>
          <a
            href="/auth/forgot-password"
            className="text-yellow-400 hover:underline"
          >
            Forgot Password?
          </a>
        </div>

        <motion.button
          onClick={handleLogin}
          disabled={isSubmitting}
          className={`w-full mt-6 py-2 rounded-lg font-semibold transition ${isSubmitting
            ? "bg-gray-500 cursor-not-allowed text-white"
            : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            }`}
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </motion.button>

        <div className="mt-4 text-center text-gray-500 text-sm">
          or continue with
        </div>

        <SocialLogin />

        <p className="text-center mt-6 text-gray-400 text-sm">
          Don't have an account?{" "}
          <a
            href="/auth/register"
            className="text-yellow-400 hover:underline"
          >
            Sign Up
          </a>
        </p>
      </motion.div>
    </div>
  );
}
