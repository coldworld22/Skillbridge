import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaLock, FaEye, FaEyeSlash, FaCheckCircle,
  FaExclamationTriangle, FaArrowLeft, FaSpinner
} from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { changeStudentPassword } from "@/services/student/studentService";

const ChangePasswordPage = ({ prevStep }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordChange = async () => {
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("❌ New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("❌ New password and confirm password do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await changeStudentPassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (err) {
      const msg = err?.response?.data?.message || "❌ Failed to update password. Try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordField = (label, value, setValue, key) => (
    <div className="mb-4" key={key}>
      <label className="block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={showPassword[key] ? "text" : "password"}
          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
          onClick={() => setShowPassword({ ...showPassword, [key]: !showPassword[key] })}
        >
          {showPassword[key] ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Navbar />
      <main className="flex flex-grow justify-center items-center pt-28 mb-16">
        <motion.div
          className="max-w-3xl w-full bg-gray-800 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-yellow-500">
            <FaLock /> Change Password
          </h2>

          {passwordField("Current Password", currentPassword, setCurrentPassword, "current")}
          {passwordField("New Password", newPassword, setNewPassword, "new")}
          {passwordField("Confirm New Password", confirmPassword, setConfirmPassword, "confirm")}

          {error && (
            <div className="p-3 bg-red-600 text-white rounded-lg mb-4 flex items-center gap-2">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-600 text-white rounded-lg mb-4 flex items-center gap-2">
              <FaCheckCircle /> Password updated successfully! Redirecting...
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              onClick={prevStep}
            >
              <FaArrowLeft /> Back
            </button>
            <button
              className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition font-bold text-lg disabled:opacity-50"
              onClick={handlePasswordChange}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangePasswordPage;
