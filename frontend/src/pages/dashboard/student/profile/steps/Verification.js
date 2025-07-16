import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaUpload,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaTrash,
  FaFilePdf,
} from "react-icons/fa";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import {
  sendEmailOtp,
  sendPhoneOtp,
  confirmEmailOtp,
  confirmPhoneOtp,
} from "@/services/verificationService";
import StudentLayout from "@/components/layouts/StudentLayout";

const Verification = ({ nextStep = () => {}, prevStep = () => {} }) => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });

  const [identityFile, setIdentityFile] = useState(null);
  const [identityPreview, setIdentityPreview] = useState(null);
  const [isPDF, setIsPDF] = useState(false);

  const sendOtp = async (type) => {
    try {
      const { code } =
        type === "email" ? await sendEmailOtp() : await sendPhoneOtp();
      setOtpSent((prev) => ({ ...prev, [type]: true }));
      toast.success(`OTP sent: ${code}`);
    } catch (err) {
      toast.error("Failed to send OTP");
    }
  };

  const verifyOtp = async (type) => {
    const enteredOTP = type === "email" ? emailOTP : phoneOTP;
    try {
      if (type === "email") await confirmEmailOtp(enteredOTP);
      else await confirmPhoneOtp(enteredOTP);
      type === "email" ? setEmailVerified(true) : setPhoneVerified(true);
      toast.success(`${type === "email" ? "Email" : "Phone"} verified`);
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired OTP";
      toast.error(msg);
    }
  };

  const handleIdentityUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIdentityFile(file);
    const fileType = file.type;

    if (fileType === "application/pdf") {
      setIsPDF(true);
      setIdentityPreview(URL.createObjectURL(file));
    } else if (fileType.startsWith("image/")) {
      setIsPDF(false);
      const reader = new FileReader();
      reader.onload = () => {
        setIdentityPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Invalid file type. Please upload an image or PDF.");
      setIdentityFile(null);
    }
  };

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

        {/* Identity Upload */}
        <div className="mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Identity Document
          </label>
          <input
            id="identityUpload"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleIdentityUpload}
            className="hidden"
          />
          <label
            htmlFor="identityUpload"
            className="cursor-pointer flex items-center gap-2 bg-white px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition"
          >
            <FaUpload /> {identityFile ? identityFile.name : "Click to Upload"}
          </label>
        </div>

        {/* Preview */}
        {identityPreview && (
          <div className="mb-6 flex flex-col items-center">
            {isPDF ? (
              <a
                href={identityPreview}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-600 flex items-center gap-2 font-medium hover:underline"
              >
                <FaFilePdf size={24} /> Open PDF
              </a>
            ) : (
              <img
                src={identityPreview}
                alt="Identity Preview"
                className="w-40 h-40 rounded-lg shadow border-2 border-yellow-500"
              />
            )}
            <button
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2"
              onClick={() => {
                setIdentityFile(null);
                setIdentityPreview(null);
              }}
            >
              <FaTrash /> Remove
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            onClick={prevStep} // ✅ was: onBack
          >
            <FaArrowLeft /> Back
          </button>
          <button
            className={`px-5 py-2 rounded-lg flex items-center gap-2 transition ${!emailVerified || !phoneVerified || !identityFile
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-yellow-500 text-white hover:bg-yellow-600"
              }`}
            onClick={nextStep}
            disabled={!emailVerified || !phoneVerified || !identityFile}
          >
            Next <FaArrowRight />
          </button>

        </div>
      </motion.div>
    </StudentLayout>

  );
};

export default Verification;
