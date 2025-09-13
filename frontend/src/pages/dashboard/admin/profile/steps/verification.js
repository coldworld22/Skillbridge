import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { FaArrowLeft, FaCheckCircle, FaEnvelope, FaPhone, FaTimes } from "react-icons/fa";
import AdminLayout from "@/components/layouts/AdminLayout";
import useAuthStore from "@/store/auth/authStore";
import {
  sendEmailOtp,
  sendPhoneOtp,
  confirmEmailOtp,
  confirmPhoneOtp,
} from "@/services/verificationService";

const Verification = ({ onBack = () => {} }) => {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [emailVerified, setEmailVerified] = useState(user?.is_email_verified || false);
  const [phoneVerified, setPhoneVerified] = useState(user?.is_phone_verified || false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });
  const [showOtpModal, setShowOtpModal] = useState(null);

  useEffect(() => {
    if (emailVerified && phoneVerified) {
      toast.success("Both email and phone verified. Redirecting to dashboard...");
      const t = setTimeout(() => router.push("/dashboard/admin"), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const sendOtp = async (type) => {
    try {
      const res = type === "email" ? await sendEmailOtp() : await sendPhoneOtp();
      if (res.verified) {
        type === "email" ? setEmailVerified(true) : setPhoneVerified(true);
        toast.info(`${type === "email" ? "Email" : "Phone"} already verified`);
        return;
      }
      setOtpSent((prev) => ({ ...prev, [type]: true }));
      setShowOtpModal(type);
      toast.success("OTP sent");
    } catch (err) {
      toast.error("Failed to send OTP");
    }
  };

  const verifyOtp = async (type) => {
    const enteredOTP = type === "email" ? emailOTP : phoneOTP;
    try {
      const res =
        type === "email"
          ? await confirmEmailOtp(enteredOTP)
          : await confirmPhoneOtp(enteredOTP);
      if (res.alreadyVerified) {
        toast.info(`${type === "email" ? "Email" : "Phone"} already verified`);
      } else {
        toast.success(`${type === "email" ? "Email" : "Phone"} verified`);
      }
      if (type === "email") setEmailVerified(true);
      if (type === "phone") setPhoneVerified(true);

      await refreshUser();

      const emailNow = type === "email" ? true : emailVerified;
      const phoneNow = type === "phone" ? true : phoneVerified;
      if (emailNow && phoneNow) {
        toast.success("Both email and phone verified. Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard/admin"), 1500);
      }
      setShowOtpModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired OTP";
      toast.error(msg);
    }
  };

  return (
    <AdminLayout>
      <motion.div
        className="p-6 bg-white text-gray-800 rounded-3xl shadow-xl border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-yellow-500">Verification</h2>

        <div className="mb-4 flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
          <FaEnvelope className="text-yellow-400 text-lg" />
          <span>Email Verification:</span>
          {emailVerified ? (
            <span className="text-green-400 flex items-center gap-1">
              <FaCheckCircle /> Verified
            </span>
          ) : otpSent.email ? (
            <button
              className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition"
              onClick={() => setShowOtpModal("email")}
            >
              Enter OTP
            </button>
          ) : (
            <button
              className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition"
              onClick={() => sendOtp("email")}
            >
              Send OTP
            </button>
          )}
        </div>

        <div className="mb-4 flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
          <FaPhone className="text-yellow-400 text-lg" />
          <span>Phone Verification:</span>
          {phoneVerified ? (
            <span className="text-green-400 flex items-center gap-1">
              <FaCheckCircle /> Verified
            </span>
          ) : otpSent.phone ? (
            <button
              className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition"
              onClick={() => setShowOtpModal("phone")}
            >
              Enter OTP
            </button>
          ) : (
            <button
              className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition"
              onClick={() => sendOtp("phone")}
            >
              Send OTP
            </button>
          )}
        </div>

        <div className="flex justify-start mt-6">
          <button
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            onClick={onBack}
          >
            <FaArrowLeft /> Back
          </button>
        </div>

        {showOtpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-80">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800">
                  Enter {showOtpModal === "email" ? "Email" : "Phone"} OTP
                </h3>
                <button onClick={() => setShowOtpModal(null)} className="text-gray-500 hover:text-gray-700">
                  <FaTimes />
                </button>
              </div>
              <input
                type="text"
                value={showOtpModal === "email" ? emailOTP : phoneOTP}
                onChange={(e) =>
                  showOtpModal === "email" ? setEmailOTP(e.target.value) : setPhoneOTP(e.target.value)
                }
              className="w-full px-3 py-2 border rounded mb-2"
              placeholder="Enter OTP"
            />
            <p className="text-xs text-gray-500 mb-2">Default OTP: <code>123456</code></p>
            <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowOtpModal(null)}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => verifyOtp(showOtpModal)}
                  className="px-4 py-2 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
                >
                  Verify
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default Verification;
