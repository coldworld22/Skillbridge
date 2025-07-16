
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { FaArrowLeft, FaCheckCircle, FaEnvelope, FaPhone } from "react-icons/fa";
import useAuthStore from "@/store/auth/authStore";
import {
  sendEmailOtp,
  sendPhoneOtp,
  confirmEmailOtp,
  confirmPhoneOtp,
} from "@/services/verificationService";
import StudentLayout from "@/components/layouts/StudentLayout";


const Verification = ({ prevStep = () => {} }) => {
  const router = useRouter();

  const { user, refreshUser } = useAuthStore();
  const [emailVerified, setEmailVerified] = useState(user?.is_email_verified || false);
  const [phoneVerified, setPhoneVerified] = useState(user?.is_phone_verified || false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });

  // Redirect immediately if already verified
  useEffect(() => {
    if (emailVerified && phoneVerified) {
      toast.success("Both email and phone verified. Redirecting to dashboard...");
      const t = setTimeout(() => router.push("/dashboard"), 1500);
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
      const { code } = res;
      setOtpSent((prev) => ({ ...prev, [type]: true }));
      toast.success(`OTP sent: ${code}`);
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
      type === "email" ? setEmailVerified(true) : setPhoneVerified(true);

      await refreshUser();

      const emailNow = type === "email" ? true : emailVerified;
      const phoneNow = type === "phone" ? true : phoneVerified;
      if (emailNow && phoneNow) {
        toast.success("Both email and phone verified. Redirecting to dashboard...");
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired OTP";
      toast.error(msg);
    }
  };

  // No identity document upload required

  return (
    <StudentLayout>
      <motion.div
        className="p-6 bg-white text-gray-800 rounded-3xl shadow-xl border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-yellow-600">🔐 Verification</h2>

        {/* Email Verification */}
        <div className="mb-4">
          <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
            <FaEnvelope className="text-yellow-500 text-lg" />
            <span className="font-medium">Email Verification:</span>
            {emailVerified ? (
              <span className="text-green-600 flex items-center gap-1">
                <FaCheckCircle /> Verified
              </span>
            ) : otpSent.email ? (
              <span className="text-sm">OTP sent</span>
            ) : (
              <button
                onClick={() => sendOtp("email")}
                className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition"
              >
                Send OTP
              </button>
            )}
          </div>

          {/* Email OTP Input */}
          {!emailVerified && otpSent.email && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Enter Email OTP"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <button
                onClick={() => verifyOtp("email")}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Verify
              </button>
            </div>
          )}
        </div>

        {/* Phone Verification */}
        <div className="mb-4">
          <div className="flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
            <FaPhone className="text-yellow-500 text-lg" />
            <span className="font-medium">Phone Verification:</span>
            {phoneVerified ? (
              <span className="text-green-600 flex items-center gap-1">
                <FaCheckCircle /> Verified
              </span>
            ) : otpSent.phone ? (
              <span className="text-sm">OTP sent</span>
            ) : (
              <button
                onClick={() => sendOtp("phone")}
                className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition"
              >
                Send OTP
              </button>
            )}
          </div>

          {/* Phone OTP Input */}
          {!phoneVerified && otpSent.phone && (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Enter Phone OTP"
                value={phoneOTP}
                onChange={(e) => setPhoneOTP(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
              <button
                onClick={() => verifyOtp("phone")}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Verify
              </button>
            </div>
          )}
        </div>


        {/* Navigation */}
        <div className="flex justify-start mt-6">
          <button
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            onClick={prevStep}
          >
            <FaArrowLeft /> Back
          </button>

        </div>
      </motion.div>
    </StudentLayout>

  );
};

export default Verification;
