import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSendOTP = () => {
    router.push("/auth/verify-otp");
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        <h2 className="text-2xl font-bold text-yellow-400 mb-6">Forgot Password?</h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          Enter your registered email, and we’ll send you an OTP to reset your password.
        </p>

        {/* Email Input */}
        <div className="w-full mb-4">
          <label className="block text-gray-400">Email</label>
          <input
            type="email"
            className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Send OTP Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="w-full bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold"
          onClick={handleSendOTP}
        >
          Send OTP
        </motion.button>
      </motion.div>
    </div>
  );
}
