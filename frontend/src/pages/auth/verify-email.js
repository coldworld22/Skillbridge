import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Link from "next/link";
import { sendEmailOtp, confirmEmailOtp } from "@/services/verificationService";
import useAuthStore from "@/store/auth/authStore";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../next-i18next.config.js";

const roleProfilePaths = {
  admin: "/dashboard/admin/profile/edit",
  instructor: "/dashboard/instructor/profile/edit",
  student: "/dashboard/student/profile/edit",
  superadmin: "/dashboard/admin/profile/edit",
};

function VerifyEmailPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (!user.profile_complete) {
      const target =
        roleProfilePaths[user.role?.toLowerCase()] || "/profile/edit";
      router.replace(target);
      return;
    }
    if (user.is_email_verified) {
      router.replace("/website");
    }
  }, [user, router]);

  const handleSendOtp = async () => {
    try {
      await sendEmailOtp();
      setOtpSent(true);
      toast.success("Verification email sent. Please check your inbox.");
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to send verification email.";
      toast.error(msg);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("Please enter the verification code.");
      return;
    }
    try {
      setSubmitting(true);
      await confirmEmailOtp(code.trim());
      await refreshUser();
      toast.success("Email verified successfully!");
      router.replace("/website");
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Invalid or expired verification code.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.is_email_verified) {
    return null;
  }

  const profileTarget =
    roleProfilePaths[user.role?.toLowerCase()] || "/profile/edit";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-yellow-500/30 bg-gray-900/80 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="text-2xl font-semibold text-center text-yellow-400">
          Verify Your Email
        </h1>
        <p className="mt-4 text-sm text-gray-300 text-center">
          We&apos;ve sent a verification code to{" "}
          <span className="font-medium text-yellow-300">{user.email}</span>.
          Enter the code below to finish setting up your account. If you need to
          update your details first, you can{" "}
          <Link href={profileTarget} className="text-yellow-400 underline">
            complete your profile here
          </Link>
          .
        </p>

        <div className="mt-6 space-y-4">
          <button
            type="button"
            onClick={handleSendOtp}
            className="w-full rounded-lg bg-yellow-500 px-4 py-2 text-gray-900 font-semibold hover:bg-yellow-400 transition disabled:opacity-60"
            disabled={otpSent}
          >
            {otpSent ? "Verification Email Sent" : "Send Verification Email"}
          </button>

          <div className="space-y-2">
            <label htmlFor="verification-code" className="text-sm text-gray-300">
              Verification Code
            </label>
            <input
              id="verification-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the 6-digit code"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-gray-100 focus:border-yellow-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleVerify}
            className="w-full rounded-lg bg-green-500 px-4 py-2 text-gray-900 font-semibold hover:bg-green-400 transition disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Verifying..." : "Verify Email"}
          </button>
        </div>

        <p className="mt-6 text-xs text-center text-gray-500">
          Didn&apos;t get the email? Check your spam folder or click &quot;Send
          Verification Email&quot; again.
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "auth"], nextI18NextConfig)),
    },
  };
}
