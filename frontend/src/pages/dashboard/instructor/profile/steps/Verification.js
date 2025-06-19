import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaUpload,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaCropAlt,
  FaTrash,
  FaFilePdf,
} from "react-icons/fa";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage"; // ✅ Import the cropping function
import {
  sendEmailOtp,
  sendPhoneOtp,
  confirmEmailOtp,
  confirmPhoneOtp,
} from "@/services/verificationService";

const Verification = ({ onNext, onBack }) => {
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [otpSent, setOtpSent] = useState({ email: false, phone: false });
  const [showOtpModal, setShowOtpModal] = useState(null);
  
  // Identity Upload & Cropping
  const [identityFile, setIdentityFile] = useState(null);
  const [identityPreview, setIdentityPreview] = useState(null);
  const [isPDF, setIsPDF] = useState(false); // ✅ Detect if file is PDF
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // ✅ Send OTP via API
  const sendOtp = async (type) => {
    try {
      if (type === "email") await sendEmailOtp();
      else await sendPhoneOtp();
      setOtpSent((prev) => ({ ...prev, [type]: true }));
      setShowOtpModal(type);
    } catch (err) {
      alert("Failed to send OTP");
    }
  };

  // ✅ Handle OTP verification via API
  const verifyOtp = async (type) => {
    const enteredOTP = type === "email" ? emailOTP : phoneOTP;
    try {
      if (type === "email") await confirmEmailOtp(enteredOTP);
      else await confirmPhoneOtp(enteredOTP);
      if (type === "email") setEmailVerified(true);
      if (type === "phone") setPhoneVerified(true);
      setShowOtpModal(null);
    } catch (err) {
      alert("Invalid OTP. Please try again.");
    }
  };

  // ✅ Handle Identity Upload (Images & PDFs)
  const handleIdentityUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIdentityFile(file);
    const fileType = file.type;

    if (fileType === "application/pdf") {
      // ✅ If PDF, do not allow cropping, just preview
      setIsPDF(true);
      setIdentityPreview(URL.createObjectURL(file));
    } else if (fileType.startsWith("image/")) {
      // ✅ If Image, allow cropping
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

  // ✅ Handle Cropping Completion
  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // ✅ Apply Cropped Image
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

      {/* ✅ Identity Upload */}
      <div className="mb-6 bg-gray-700 p-4 rounded-lg">
        <label className="block text-gray-300 mb-2">Upload Identity Document:</label>
        <input id="identityUpload" type="file" accept="image/*,application/pdf" onChange={handleIdentityUpload} className="hidden" />
        <label htmlFor="identityUpload" className="cursor-pointer flex items-center gap-2 bg-gray-600 p-3 rounded-lg hover:bg-gray-500 transition">
          <FaUpload className="text-yellow-400" /> {identityFile ? identityFile.name : "Click to Upload"}
        </label>
      </div>

      {/* ✅ Preview Identity Document */}
      {identityPreview && (
        <div className="mb-6 flex flex-col items-center">
          {isPDF ? (
            <a href={identityPreview} target="_blank" rel="noopener noreferrer" className="text-yellow-400 flex items-center gap-2">
              <FaFilePdf size={30} /> Open PDF
            </a>
          ) : (
            <img src={identityPreview} alt="Identity Preview" className="w-40 h-40 rounded-lg shadow-lg border-2 border-yellow-500" />
          )}
          <button className="mt-2 px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-2" onClick={() => setIdentityFile(null)}>
            <FaTrash /> Remove
          </button>
        </div>
      )}

      {/* ✅ Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2" onClick={onBack}>
          <FaArrowLeft /> Back
        </button>
        <button className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2" onClick={onNext} disabled={!emailVerified || !phoneVerified || !identityFile}>
          Next <FaArrowRight />
        </button>
      </div>
    </motion.div>
  );
};

export default Verification;
