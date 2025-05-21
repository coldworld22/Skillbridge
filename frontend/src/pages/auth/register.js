import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "react-toastify";
import {
  FaGoogle, FaFacebook, FaApple, FaCheckCircle,
  FaTimesCircle, FaEye, FaEyeSlash
} from "react-icons/fa";

import logo from "@/shared/assets/images/login/logo.png";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import * as authService from "@/services/auth/authService";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "Student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const nameValid = form.name.trim().length >= 3;
  const passwordsMatch = form.password === form.confirmPassword;
  const passwordRules = {
    length: form.password.length >= 8,
    capital: /[A-Z]/.test(form.password),
    specialChar: /[\W_]/.test(form.password),
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    if (!emailValid || !nameValid || !passwordsMatch || !Object.values(passwordRules).every(Boolean)) {
      toast.error("Please complete the form correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.registerUser({
        full_name: form.name,
        email: form.email,
        password: form.password,
        phone: null, // Optional
        role: form.userType,
      });
      toast.success("Registration successful. Redirecting to login...");
      setTimeout(() => router.push("/auth/login"), 1000);
    } catch (err) {
      const msg = err?.response?.data?.error || "Registration failed.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
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
              onClick={() => handleChange("userType", type)}
              whileHover={{ scale: 1.05 }}
              className={`w-1/2 px-3 py-2 text-sm rounded-md font-semibold transition ${form.userType === type ? "bg-yellow-500 text-gray-900" : "text-gray-400 hover:bg-gray-600"}`}
            >
              {type}
            </motion.button>
          ))}
        </div>

        {/* Name */}
        <div className="w-full mb-3">
          <label className="block text-gray-400">Full Name</label>
          <div className="relative">
            <input
              type="text"
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white"
              placeholder="Enter your name"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
            {form.name && (
              <span className="absolute right-3 top-3">
                {nameValid ? <FaCheckCircle className="text-yellow-500" /> : <FaTimesCircle className="text-red-500" />}
              </span>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="w-full mb-3">
          <label className="block text-gray-400">Email</label>
          <div className="relative">
            <input
              type="email"
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
            {form.email && (
              <span className="absolute right-3 top-3">
                {emailValid ? <FaCheckCircle className="text-yellow-500" /> : <FaTimesCircle className="text-red-500" />}
              </span>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="w-full mb-3">
          <label className="block text-gray-400">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white"
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
            />
            <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          <ul className="text-xs text-yellow-500 mt-2">
            <li>{passwordRules.length ? "✔ At least 8 characters" : "❌ At least 8 characters"}</li>
            <li>{passwordRules.capital ? "✔ One uppercase letter" : "❌ One uppercase letter"}</li>
            <li>{passwordRules.specialChar ? "✔ One special character" : "❌ One special character"}</li>
          </ul>
        </div>

        {/* Confirm Password */}
        <div className="w-full mb-3">
          <label className="block text-gray-400">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
            />
            <span className="absolute right-3 top-3 cursor-pointer" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleRegister}
          disabled={isSubmitting}
          className={`w-full mt-4 py-2 rounded-lg font-semibold transition ${isSubmitting ? "bg-gray-500 cursor-not-allowed" : "bg-yellow-500 hover:bg-yellow-600 text-gray-900"}`}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </motion.button>

        {/* Divider */}
        <div className="mt-4 text-center text-gray-500">or continue with</div>

        <div className="mt-4 flex space-x-4">
          {[FaGoogle, FaFacebook, FaApple].map((Icon, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              className="w-14 h-14 flex items-center justify-center bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition"
            >
              <Icon size={28} />
            </motion.button>
          ))}
        </div>

        <p className="text-center mt-6 text-gray-400 text-sm">
          Already have an account?{' '}
          <a href="/auth/login" className="text-yellow-400 hover:underline">Login</a>
        </p>
      </motion.div>
    </div>
  );
}