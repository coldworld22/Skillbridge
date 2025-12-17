import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import Link from "next/link";
import { sendEmailOtp, confirmEmailOtp } from "@/services/verificationService";
import useAuthStore from "@/store/auth/authStore";
import BackgroundAnimation from "@/shared/components/auth/BackgroundAnimation";
import styles from "@/shared/components/auth/auth.module.scss";
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
      const target = roleProfilePaths[user.role?.toLowerCase()];
      if (target) {
        router.replace(target);
        return;
      }
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

  const profileTarget = roleProfilePaths[user.role?.toLowerCase()];

  return (
    <div className={styles.authPage}>
      <BackgroundAnimation />
      <div className={`${styles.card} ${styles.compactCard}`}>
        <h1 className={styles.title}>Verify Your Email</h1>
        <p className={styles.subtitle}>
          We&apos;ve sent a verification code to <span className={styles.link}>{user.email}</span>. Enter the code below
          to finish setting up your account.
          {profileTarget ? (
            <>
              {" "}If you need to update your details first, you can{" "}
              <Link href={profileTarget} className={styles.link}>
                complete your profile here
              </Link>
              .
            </>
          ) : (
            <> If you need to update your details first, please visit your dashboard.</>
          )}
        </p>

        <div className={styles.form}>
          <button
            type="button"
            onClick={handleSendOtp}
            className={styles.primaryButton}
            disabled={otpSent}
          >
            {otpSent ? "Verification Email Sent" : "Send Verification Email"}
          </button>

          <div className={styles.field}>
            <label htmlFor="verification-code" className={styles.label}>
              Verification Code
            </label>
            <input
              id="verification-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the 6-digit code"
              className={styles.input}
            />
          </div>

          <button
            type="button"
            onClick={handleVerify}
            className={`${styles.primaryButton} ${styles.successButton}`}
            disabled={submitting}
          >
            {submitting ? "Verifying..." : "Verify Email"}
          </button>
        </div>

        <p className={`${styles.helper} ${styles.smallText}`}>
          Didn&apos;t get the email? Check your spam folder or click "Send Verification Email" again.
        </p>
      </div>
    </div>
  );
}

export default VerifyEmailPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common", "auth"], nextI18NextConfig)),
    },
  };
}
