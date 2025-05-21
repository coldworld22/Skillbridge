import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaUpload, FaCheckCircle, FaEnvelope, FaPhone, FaCropAlt, FaTrash, FaFilePdf } from "react-icons/fa";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";

const Verification = ({ onNext, onBack }) => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });
  const [showOtpModal, setShowOtpModal] = useState(null);

  const [identityFile, setIdentityFile] = useState(null);
  const [identityPreview, setIdentityPreview] = useState(null);
  const [isPDF, setIsPDF] = useState(false);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const sendOtp = (type) => {
    setOtpSent((prev) => ({ ...prev, [type]: true }));
    setShowOtpModal(type);
  };

  const verifyOtp = (type) => {
    const enteredOTP = type === "email" ? emailOTP : phoneOTP;
    const correctOTP = "123456"; // Mock

    if (enteredOTP === correctOTP) {
      if (type === "email") setEmailVerified(true);
      if (type === "phone") setPhoneVerified(true);
      setShowOtpModal(null);
    } else {
      alert("Invalid OTP. Please try again.");
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
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Invalid file type. Please upload an image or PDF.");
      setIdentityFile(null);
    }
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!identityPreview || !croppedAreaPixels) return;

    try {
      const croppedImg = await getCroppedImg(identityPreview, croppedAreaPixels);
      setCroppedImage(croppedImg);
      setShowCropper(false);
    } catch (error) {
      console.error("Error cropping image:", error);
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
      <h2 className="text-2xl font-bold mb-6 text-yellow-600">🔐 Verification</h2>

      {/* Email Verification */}
      <div className="mb-4 flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
        <FaEnvelope className="text-yellow-500 text-lg" />
        <span className="font-medium">Email Verification:</span>
        {emailVerified ? (
          <span className="text-green-600 flex items-center gap-1">
            <FaCheckCircle /> Verified
          </span>
        ) : otpSent.email ? (
          <button onClick={() => setShowOtpModal("email")} className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition">Enter OTP</button>
        ) : (
          <button onClick={() => sendOtp("email")} className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition">Send OTP</button>
        )}
      </div>

      {/* Phone Verification */}
      <div className="mb-4 flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
        <FaPhone className="text-yellow-500 text-lg" />
        <span className="font-medium">Phone Verification:</span>
        {phoneVerified ? (
          <span className="text-green-600 flex items-center gap-1">
            <FaCheckCircle /> Verified
          </span>
        ) : otpSent.phone ? (
          <button onClick={() => setShowOtpModal("phone")} className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition">Enter OTP</button>
        ) : (
          <button onClick={() => sendOtp("phone")} className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition">Send OTP</button>
        )}
      </div>

      {/* Identity Upload */}
      <div className="mb-6 bg-gray-100 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Identity Document</label>
        <input id="identityUpload" type="file" accept="image/*,application/pdf" onChange={handleIdentityUpload} className="hidden" />
        <label htmlFor="identityUpload" className="cursor-pointer flex items-center gap-2 bg-white px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 transition">
          <FaUpload /> {identityFile ? identityFile.name : "Click to Upload"}
        </label>
      </div>

      {/* Preview */}
      {identityPreview && (
        <div className="mb-6 flex flex-col items-center">
          {isPDF ? (
            <a href={identityPreview} target="_blank" rel="noopener noreferrer" className="text-yellow-600 flex items-center gap-2 font-medium hover:underline">
              <FaFilePdf size={24} /> Open PDF
            </a>
          ) : (
            <img src={identityPreview} alt="Identity Preview" className="w-40 h-40 rounded-lg shadow border-2 border-yellow-500" />
          )}
          <button className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2" onClick={() => setIdentityFile(null)}>
            <FaTrash /> Remove
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-2" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>
        <button
          className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
          onClick={onNext}
          disabled={!emailVerified || !phoneVerified || !identityFile}
        >
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default Verification;
