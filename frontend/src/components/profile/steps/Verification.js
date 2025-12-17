import { useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaEnvelope, FaTimes } from "react-icons/fa";
import useAuthStore from "@/store/auth/authStore";
import { sendEmailOtp, confirmEmailOtp } from "@/services/verificationService";
import styles from "./Verification.module.scss";

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
      className={styles.card}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className={styles.title}>Verification</h2>

      <div className={styles.row}>
        <FaEnvelope className="text-yellow-400 text-lg" />
        <span>Email Verification:</span>
        {emailVerified ? (
          <span className={styles.statusVerified}>
            <FaCheckCircle /> Verified
          </span>
        ) : otpSent ? (
          <button
            className={styles.action}
            onClick={() => setShowOtpModal(true)}
          >
            Enter OTP
          </button>
        ) : (
          <button
            className={styles.action}
            onClick={sendOtp}
          >
            Send OTP
          </button>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.back}`}
          onClick={onBack}
          type="button"
        >
          <FaArrowLeft /> Back
        </button>
        <button
          className={`${styles.button} ${styles.next}`}
          onClick={onNext}
          disabled={!emailVerified}
          type="button"
        >
          Next <FaArrowRight />
        </button>
      </div>

      {showOtpModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Enter Email OTP</h3>
              <button onClick={() => setShowOtpModal(false)} className={styles.modalClose} type="button">
                <FaTimes />
              </button>
            </div>
            <input
              type="text"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value)}
              className={styles.otpInput}
              placeholder="Enter OTP"
            />
            <p className={styles.helper}>
              Default OTP: <code>123456</code>
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowOtpModal(false)}
                className={`${styles.button} ${styles.secondary}`}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={verifyOtp}
                className={`${styles.button} ${styles.next}`}
                type="button"
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
