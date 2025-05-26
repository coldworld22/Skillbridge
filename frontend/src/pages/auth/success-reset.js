// 📁 src/pages/auth/success-reset.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";

import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";

export default function SuccessReset() {
  const router = useRouter();

  useEffect(() => {
    const verifiedEmail = localStorage.getItem("otp_verified_email");
    if (!verifiedEmail) {
      toast.info("Please complete the OTP verification first.");
      router.replace("/auth/forgot-password");
    } else {
      toast.success("Password reset successful!");
      localStorage.removeItem("otp_verified_email"); // Clean up
    }
  }, [router]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="mb-4"
        >
          <FaCheckCircle className="text-yellow-500 text-6xl" />
        </motion.div>

        <h2 className="text-2xl font-bold text-yellow-400 mb-4">
          Password Reset Successful!
        </h2>
        <p className="text-gray-400 text-center mb-4">
          Your password has been updated. You can now log in with your new credentials.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          className="w-full bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold mt-6"
          onClick={() => router.push("/auth/login")}
        >
          Go to Login
        </motion.button>
      </motion.div>
    </div>
  );
}
