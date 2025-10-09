import { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaEnvelope, FaTimes } from "react-icons/fa";
import useAuthStore from "@/store/auth/authStore";
import { sendEmailOtp, confirmEmailOtp } from "@/services/verificationService";

const Verification = ({ onNext, onBack }) => {
  const { user, refreshUser } = useAuthStore();
  const [emailVerified, setEmailVerified] = useState(user?.is_email_verified || false);
  const [emailOTP, setEmailOTP] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const sendOtp = async () => {
    try {
      const res = await sendEmailOtp();
      if (res.verified) {
        setEmailVerified(true);
        toast.info("Email already verified");
        return;
      }
      setOtpSent(true);
      setShowOtpModal(true);
      toast.success("OTP sent");
    } catch (err) {
      toast.error("Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
    if (!emailOTP.trim()) {
      toast.error("Please enter the verification code");
      return;
    }
    try {
      const res = await confirmEmailOtp(emailOTP.trim());
      if (res.alreadyVerified) {
        toast.info("Email already verified");
      } else {
        toast.success("Email verified");
      }
      setEmailVerified(true);
      await refreshUser();
      setShowOtpModal(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired OTP";
      toast.error(msg);
    }
  };

  return (
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
        ) : otpSent ? (
          <button
            className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition"
            onClick={() => setShowOtpModal(true)}
          >
            Enter OTP
          </button>
        ) : (
          <button
            className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition"
            onClick={sendOtp}
          >
            Send OTP
          </button>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button
          className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
          onClick={onBack}
        >
          <FaArrowLeft /> Back
        </button>
        <button
          className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
          onClick={onNext}
          disabled={!emailVerified}
        >
          Next <FaArrowRight />
        </button>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">Enter Email OTP</h3>
              <button onClick={() => setShowOtpModal(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes />
              </button>
            </div>
            <input
              type="text"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-2"
              placeholder="Enter OTP"
            />
            <p className="text-xs text-gray-500 mb-2">
              Default OTP: <code>123456</code>
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowOtpModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={verifyOtp}
                className="px-4 py-2 bg-yellow-500 text-gray-900 rounded hover:bg-yellow-600"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Verification;
