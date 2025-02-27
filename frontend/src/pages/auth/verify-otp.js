import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";

export default function VerifyOTP() {
  const [otp, setOTP] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  // Start countdown when page loads
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerifyOTP = () => {
    setIsVerified(true);
    setTimeout(() => {
      router.push("/auth/reset-password");
    }, 2500); // Redirect after 2.5 seconds
  };

  const handleResendOTP = () => {
    setCanResend(false);
    setResendTimer(30);
    alert("A new OTP has been sent to your email!");
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
              Enter the OTP sent to your email to proceed with resetting your password.
            </p>

            {/* OTP Input */}
            <div className="w-full mb-4">
              <label className="block text-gray-400">OTP Code</label>
              <motion.input
                type="text"
                className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500 text-center tracking-widest"
                placeholder="Enter OTP"
                maxLength="6"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              />
            </div>

            {/* Verify Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="w-full bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold"
              onClick={handleVerifyOTP}
            >
              Verify OTP
            </motion.button>

            {/* Resend OTP Section */}
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
          // ✅ Centered Success Confirmation with Animation
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
