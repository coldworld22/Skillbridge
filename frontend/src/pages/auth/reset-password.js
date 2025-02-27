import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleResetPassword = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    router.push("/auth/success-reset");
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
          Enter a new password for your account.
        </p>

        {/* New Password Input */}
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
        </div>

        {/* Confirm Password Input */}
        <div className="w-full mb-4">
          <label className="block text-gray-400">Confirm Password</label>
          <input
            type="password"
            className="w-full px-3 py-2 mt-2 border rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-yellow-500"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Reset Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          className="w-full bg-yellow-500 text-gray-900 py-2 rounded-lg hover:bg-yellow-600 transition font-semibold"
          onClick={handleResetPassword}
        >
          Reset Password
        </motion.button>
      </motion.div>
    </div>
  );
}
