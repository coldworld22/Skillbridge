import { useState } from "react";
import { motion } from "framer-motion";
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer"; // ✅ Import Footer

const ChangePasswordPage = ({ prevStep }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ✅ Handle Password Change
  const handlePasswordChange = () => {
    setError(""); // Reset error

    // 🔹 Validate Current Password (Mock: Replace with API call)
    if (currentPassword !== "mockOldPassword") {
      setError("❌ Current password is incorrect.");
      return;
    }

    // 🔹 Validate Password Strength
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[!@#$%^&*]/.test(newPassword)) {
      setError("❌ Password must be 8+ characters, include an uppercase letter, a number, and a special character.");
      return;
    }

    // 🔹 Confirm Password Match
    if (newPassword !== confirmPassword) {
      setError("❌ New password and confirm password do not match.");
      return;
    }

    // 🔹 Success! (Mock: Send update request to backend)
    console.log("🚀 Password updated successfully!");
    setSuccess(true);

    // 🔹 Clear input fields
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    // 🔹 Auto Logout & Redirect (Mock)
    setTimeout(() => {
      alert("🔐 Password changed successfully! Please log in again.");
      window.location.href = "/login"; // Redirect to login
    }, 2000);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      {/* ✅ Navbar Component */}
      <Navbar />

      {/* ✅ Main Content with Spacing for Footer */}
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

          {/* ✅ Current Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Current Password</label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
              >
                {showPassword.current ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* ✅ New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium">New Password</label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
              >
                {showPassword.new ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* ✅ Confirm Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium">Confirm New Password</label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
              >
                {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {/* ✅ Error Message */}
          {error && (
            <div className="p-3 bg-red-600 text-white rounded-lg mb-4 flex items-center gap-2">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          {/* ✅ Success Message */}
          {success && (
            <div className="p-3 bg-green-600 text-white rounded-lg mb-4 flex items-center gap-2">
              <FaCheckCircle /> Password updated successfully! Redirecting...
            </div>
          )}

          {/* ✅ Navigation & Submit Buttons */}
          <div className="flex justify-between mt-6">
            <button
              className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              onClick={prevStep}
            >
              <FaArrowLeft /> Back
            </button>
            <button
              className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition font-bold text-lg"
              onClick={handlePasswordChange}
            >
              Update Password
            </button>
          </div>
        </motion.div>
      </main>

      {/* ✅ Footer Component */}
      <Footer />
    </div>
  );
};

export default ChangePasswordPage;
