import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaLock, FaEye, FaEyeSlash, FaCheckCircle,
  FaExclamationTriangle, FaArrowLeft, FaSpinner
} from "react-icons/fa";

import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";
import { changeStudentPassword } from "@/services/student/studentService";
import { changeInstructorPassword } from "@/services/instructor/instructorService";
import { changeAdminPassword } from "@/services/admin/adminService";

const ChangePasswordPage = ({ prevStep }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { user, accessToken } = useAuthStore.getState();

  useEffect(() => {
    if (!user || !accessToken) {
      toast.error("You must be logged in to access this page.");
      router.replace("/auth/login");
    }
  }, [user, accessToken]);

  const handlePasswordChange = async () => {
    setError("");
    setSuccess(false);

    // Password strength check
    if (
      newPassword.length < 5 ||
      !/[A-Z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[!@#$%^&*]/.test(newPassword)
    ) {
      const msg =
        "Password must be 5+ characters, include an uppercase letter, a number, and a special character.";
      setError(`❌ ${msg}`);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = "New password and confirm password do not match.";
      setError(`❌ ${msg}`);
      toast.error(msg);
      return;
    }

    try {
      setIsSubmitting(true);

      if (user.role === "Student") {
        await changeStudentPassword({ currentPassword, newPassword });
      } else if (user.role === "Instructor") {
        await changeInstructorPassword({ currentPassword, newPassword });
      } else if (user.role === "Admin" || user.role === "SuperAdmin") {
        await changeAdminPassword(user.id, newPassword);
      } else {
        throw new Error("Your role is not allowed to perform this action.");
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password updated! Please log in again.");
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || err.message || "Failed to update password";
      setError(`❌ ${msg}`);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordInput = (label, value, setValue, key) => (
    <div className="mb-4">
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
          onClick={() => setShowPassword(prev => ({ ...prev, [key]: !prev[key] }))}
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

          {passwordInput("Current Password", currentPassword, setCurrentPassword, "current")}
          {passwordInput("New Password", newPassword, setNewPassword, "new")}
          {passwordInput("Confirm New Password", confirmPassword, setConfirmPassword, "confirm")}

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
