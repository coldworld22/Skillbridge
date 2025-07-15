import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import { resetPassword } from "@/services/auth/authService";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!router.isReady) return; // wait for query params

    const queryEmail = router.query.email;
    const queryCode = router.query.code;
    const storedEmail = localStorage.getItem("otp_verified_email");
    const storedCode = localStorage.getItem("otp_verified_code");

    if (queryEmail && queryCode) {
      localStorage.setItem("otp_verified_email", queryEmail);
      localStorage.setItem("otp_verified_code", queryCode);
      setEmail(queryEmail);
      setCode(queryCode);
    } else if (storedEmail && storedCode) {
      setEmail(storedEmail);
      setCode(storedCode);
    } else {
      toast.error("Missing OTP verification. Please try again.");
      router.replace("/auth/forgot-password");
    }
  }, [router.isReady, router.query]);

  const isStrongPassword =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[\W_]/.test(newPassword);

  const handleResetPassword = async () => {
    if (!isStrongPassword) {
      toast.error("Password must be at least 8 characters with uppercase and special character.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      await resetPassword({ email, code, new_password: newPassword });
      toast.success("Password reset successful!");
      router.push("/auth/success-reset");
    } catch (err) {
      const msg = err?.response?.data?.message || "Password reset failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      <BackgroundAnimation />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gray-800 rounded-lg shadow-lg p-8 w-96 border border-gray-700 text-white flex flex-col items-center"
      >
        <h2 className="text-2xl font-bold text-yellow-400 mb-6">Reset Password</h2>
        <p className="text-gray-400 text-sm text-center mb-4">
          Enter a new password for <span className="text-yellow-300 font-medium">{email}</span>
        </p>

        {/* ✅ New Password Input */}
        <div className="w-full mb-4">
          <label className="block text-gray-400">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <span
              className="absolute right-3 top-3 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
            </span>
          </div>
          <ul className="text-xs text-yellow-500 mt-2">
            <li>{newPassword.length >= 8 ? "✔ At least 8 characters" : "❌ At least 8 characters"}</li>
            <li>{/[A-Z]/.test(newPassword) ? "✔ One uppercase letter" : "❌ One uppercase letter"}</li>
            <li>{/[\W_]/.test(newPassword) ? "✔ One special character" : "❌ One special character"}</li>
          </ul>
        </div>

        {/* ✅ Confirm Password Input */}
        <div className="w-full mb-4">
          <label className="block text-gray-400">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <span
              className="absolute right-3 top-3 cursor-pointer"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
            </span>
          </div>
        </div>

        {/* ✅ Reset Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          onClick={handleResetPassword}
          className="w-full bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold"
        >
          Reset Password
        </motion.button>
      </motion.div>
    </div>
  );
}
