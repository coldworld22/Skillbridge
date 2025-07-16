import { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaEnvelope, FaPhone } from "react-icons/fa";
import useAuthStore from "@/store/auth/authStore";
import {
  sendEmailOtp,
  sendPhoneOtp,
  confirmEmailOtp,
  confirmPhoneOtp,
} from "@/services/verificationService";

const Verification = ({ onNext, onBack }) => {
  const { user } = useAuthStore();
  const [emailVerified, setEmailVerified] = useState(user?.is_email_verified || false);
  const [phoneVerified, setPhoneVerified] = useState(user?.is_phone_verified || false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });
  const [showOtpModal, setShowOtpModal] = useState(null);

  // ✅ Send OTP via API
  const sendOtp = async (type) => {
    try {
      const res = type === "email" ? await sendEmailOtp() : await sendPhoneOtp();
      if (res.verified) {
        type === "email" ? setEmailVerified(true) : setPhoneVerified(true);
        toast.info(`${type === "email" ? "Email" : "Phone"} already verified`);
        return;
      }
      const { code } = res;
      setOtpSent((prev) => ({ ...prev, [type]: true }));
      setShowOtpModal(type);
      toast.success(`OTP sent: ${code}`);
    } catch (err) {
      toast.error("Failed to send OTP");
    }
  };

  // ✅ Handle OTP verification via API
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

      const emailNow = type === "email" ? true : emailVerified;
      const phoneNow = type === "phone" ? true : phoneVerified;
      if (emailNow && phoneNow) {
        toast.success("Both email and phone verified. You can proceed.");
      }
      setShowOtpModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired OTP";
      toast.error(msg);
    }
  };

  // No identity document upload required

  return (
    <motion.div
      className="p-6 bg-gray-800 text-white rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-2xl font-bold mb-4 text-yellow-500">Verification</h2>

      {/* ✅ Email Verification Section */}
      <div className="mb-4 flex items-center gap-3 bg-gray-700 p-3 rounded-lg">
        <FaEnvelope className="text-yellow-400 text-lg" />
        <span>Email Verification:</span>
        {emailVerified ? (
          <span className="text-green-400 flex items-center gap-1">
            <FaCheckCircle /> Verified
          </span>
        ) : otpSent.email ? (
          <button className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition" onClick={() => setShowOtpModal("email")}>
            Enter OTP
          </button>
        ) : (
          <button className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition" onClick={() => sendOtp("email")}>
            Send OTP
          </button>
        )}
      </div>

      {/* ✅ Phone Verification Section */}
      <div className="mb-4 flex items-center gap-3 bg-gray-700 p-3 rounded-lg">
        <FaPhone className="text-yellow-400 text-lg" />
        <span>Phone Verification:</span>
        {phoneVerified ? (
          <span className="text-green-400 flex items-center gap-1">
            <FaCheckCircle /> Verified
          </span>
        ) : otpSent.phone ? (
          <button className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition" onClick={() => setShowOtpModal("phone")}>
            Enter OTP
          </button>
        ) : (
          <button className="bg-yellow-500 px-3 py-1 rounded-lg text-gray-900 hover:bg-yellow-600 transition" onClick={() => sendOtp("phone")}>
            Send OTP
          </button>
        )}
      </div>


      {/* ✅ Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>
        <button className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2" onClick={onNext} disabled={!emailVerified || !phoneVerified}>
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default Verification;
