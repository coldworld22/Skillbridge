import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaEnvelope } from "react-icons/fa";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import { sendEmailOtp, confirmEmailOtp } from "@/services/verificationService";
import InstructorLayout from "@/components/layouts/InstructorLayout";

const Verification = ({ prevStep = () => {} }) => {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);

  const [emailVerified, setEmailVerified] = useState(user?.is_email_verified || false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailOTP, setEmailOTP] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (emailVerified) {
      toast.success("Email verified. Redirecting to dashboard...");
      const timer = setTimeout(() => router.push("/dashboard/instructor"), 1200);
      return () => clearTimeout(timer);
    }
  }, [emailVerified, router]);

  const handleSendOtp = async () => {
    try {
      const res = await sendEmailOtp();
      if (res.verified) {
        setEmailVerified(true);
        toast.info("Email already verified");
        return;
      }
      setOtpSent(true);
      toast.success("Verification code sent to your email");
    } catch (err) {
      toast.error("Failed to send verification email");
    }
  };

  const handleVerify = async () => {
    if (!emailOTP.trim()) {
      toast.error("Enter the verification code");
      return;
    }
    try {
      setSubmitting(true);
      const res = await confirmEmailOtp(emailOTP.trim());
      if (res.alreadyVerified) {
        toast.info("Email already verified");
      } else {
        toast.success("Email verified successfully");
      }
      setEmailVerified(true);
      await refreshUser();
      refreshNotifications?.();
      refreshMessages?.();

      try {
        await createNotification({
          user_id: user.id,
          type: "verification",
          message: "Email verified successfully.",
        });
        await sendChatMessage(user.id, { text: "Email verified successfully." });
        refreshNotifications?.();
        refreshMessages?.();
      } catch (notifyErr) {
        console.error(notifyErr);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid or expired verification code";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InstructorLayout>
      <motion.div
        className="p-6 bg-white text-gray-800 rounded-3xl shadow-xl border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-yellow-600">🔐 Email Verification</h2>

        <div className="mb-4 flex items-center gap-3 bg-gray-100 p-3 rounded-lg border border-gray-200">
          <FaEnvelope className="text-yellow-500 text-lg" />
          <span className="font-medium">Email Verification:</span>
          {emailVerified ? (
            <span className="text-green-600 flex items-center gap-1">
              <FaCheckCircle /> Verified
            </span>
          ) : otpSent ? (
            <span className="text-sm text-gray-700">Code sent to {user.email}</span>
          ) : (
            <button
              onClick={handleSendOtp}
              className="bg-yellow-500 px-3 py-1 rounded-lg text-white hover:bg-yellow-600 transition"
            >
              Send Verification Email
            </button>
          )}
        </div>

        {!emailVerified && otpSent && (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="Enter verification code"
              value={emailOTP}
              onChange={(e) => setEmailOTP(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <button
              onClick={handleVerify}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Verifying..." : "Verify Email"}
            </button>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
            onClick={prevStep}
          >
            <FaArrowLeft /> Back
          </button>
          <button
            className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
            onClick={() => router.push("/dashboard/instructor")}
            disabled={!emailVerified}
          >
            Finish <FaArrowRight />
          </button>
        </div>
      </motion.div>
    </InstructorLayout>
  );
};

export default Verification;
