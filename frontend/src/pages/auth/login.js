import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Image from "next/image";
import logo from "@/shared/assets/images/login/logo.png";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import InputField from "@/shared/components/auth/InputField";  // ✅ Use reusable input fields
import SocialLogin from "@/shared/components/auth/SocialLogin"; // ✅ Use reusable social login buttons

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    setTimeout(() => {
      router.push("/website"); // ✅ Navigates to website homepage after login
    }, 500);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      {/* Background Animation */}
      <BackgroundAnimation />

      {/* Login Container */}
      <motion.div
        whileHover={{ scale: 1.03, boxShadow: "0px 10px 30px rgba(234, 179, 8, 0.2)" }}
        transition={{ duration: 0.3 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        {/* Circular Logo with Border */}
        <div className="w-24 h-24 rounded-full border-4 border-yellow-500 bg-gray-900 flex items-center justify-center mb-4 shadow-lg">
          <Image src={logo} alt="SkillBridge Logo" width={80} height={80} priority className="rounded-full" />
        </div>

        <h2 className="text-2xl font-bold text-center text-yellow-400 mb-6">Welcome to SkillBridge 🎓</h2>

        {/* Email Input */}
        <InputField
          label="Email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password Input */}
        <InputField
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Remember Me + Forgot Password */}
        <div className="mt-4 flex items-center justify-between w-full">
          <label className="flex items-center text-gray-400">
            <input type="checkbox" className="mr-2" /> Remember Me
          </label>
          <a href="/auth/forgot-password" className="text-yellow-400 hover:underline">Forgot Password?</a>
        </div>

        {/* Login Button */}
        <motion.button
          className="w-full mt-6 bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold"
          onClick={handleLogin}
        >
          Login
        </motion.button>

        {/* Divider */}
        <div className="mt-4 text-center text-gray-500">or continue with</div>

        {/* Social Login Buttons */}
        <SocialLogin />

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-gray-400">
          Don't have an account?{" "}
          <a href="/auth/register" className="text-yellow-400 hover:underline">
            Sign Up
          </a>
        </p>
      </motion.div>

    </div>
  );
}
