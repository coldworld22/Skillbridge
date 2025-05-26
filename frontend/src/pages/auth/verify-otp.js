// 📁 src/pages/auth/verify-otp.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FaCheckCircle } from "react-icons/fa";

import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import { verifyOtpCode, requestPasswordReset } from "@/services/auth/authService";

// ✅ OTP Schema
const otpSchema = z.object({
  code: z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must be numeric"),
});

export default function VerifyOTP() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: "" },
  });

  // ⏱ Countdown for Resend OTP
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // 🔁 Load email from query or storage
  useEffect(() => {
    const fromQuery = router.query.email;
    const fromStorage = localStorage.getItem("otp_email");
    if (fromQuery) setEmail(fromQuery);
    else if (fromStorage) setEmail(fromStorage);
    else {
      toast.error("Email not found. Please start the reset process again.");
      router.push("/auth/forgot-password");
    }
  }, [router.query.email]);

  // ✅ Handle OTP verification
  const onSubmit = async ({ code }) => {
    try {
      const result = await verifyOtpCode({ email, code });
      if (result.valid) {
        toast.success("OTP verified!");
        localStorage.setItem("otp_verified_email", email);
        localStorage.setItem("otp_verified_code", code);

        setIsVerified(true);
        setTimeout(() => router.push("/auth/reset-password"), 2000);
      } else {
        toast.error("Invalid OTP code.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Verification failed.";
      toast.error(msg);
    }
  };

  // 🔁 Handle resend OTP
  const handleResendOTP = async () => {
    try {
      await requestPasswordReset(email);
      toast.success("A new OTP has been sent.");
      setCanResend(false);
      setResendTimer(30);
    } catch (err) {
      toast.error("Failed to resend OTP.");
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        {!isVerified ? (
          <>
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Verify OTP</h2>
            <p className="text-gray-400 text-sm text-center mb-4">
              Enter the OTP sent to <span className="text-yellow-400 font-medium">{email}</span>
            </p>

            {/* OTP Input */}
            <form onSubmit={handleSubmit(onSubmit)} className="w-full">
              <div className="mb-4">
                <label className="block text-gray-400">OTP Code</label>
                <motion.input
                  type="text"
                  maxLength="6"
                  placeholder="Enter OTP"
                  className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white text-center tracking-widest focus:ring-2 focus:ring-yellow-500"
                  {...register("code")}
                />
                {errors.code && (
                  <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>
                )}
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                className="w-full bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold"
              >
                Verify OTP
              </motion.button>
            </form>

            {/* Resend OTP */}
            <div className="mt-4 text-center">
              {canResend ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="text-yellow-400 hover:underline"
                  onClick={handleResendOTP}
                >
                  Resend OTP
                </motion.button>
              ) : (
                <p className="text-gray-400 text-sm">Resend OTP in {resendTimer}s</p>
              )}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex flex-col items-center justify-center h-48"
          >
            <FaCheckCircle className="text-yellow-500 text-6xl mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">OTP Verified!</h2>
            <p className="text-gray-400 text-center">Redirecting to reset your password...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
