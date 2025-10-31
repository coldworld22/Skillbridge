import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaLock, FaEye, FaEyeSlash, FaCheckCircle,
  FaExclamationTriangle, FaArrowLeft, FaSpinner, FaTimesCircle
} from "react-icons/fa";

import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";
import { changeStudentPassword } from "@/services/student/studentService";
import { changeInstructorPassword } from "@/services/instructor/instructorService";
import { changeAdminPassword } from "@/services/admin/adminService";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { useTranslation } from "next-i18next";

const ChangePasswordPage = ({ prevStep }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);
  const { t } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");

  useEffect(() => {
    if (!user || !accessToken) {
      toast.error(t("must_be_logged_in"));
      router.replace("/auth/login");
    }
  }, [user, accessToken, t, router]);

  const passwordChecks = useMemo(
    () => ({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      special: /[!@#$%^&*]/.test(newPassword),
    }),
    [newPassword]
  );

  const passwordRequirementItems = useMemo(
    () => [
      { key: "length", label: t("at_least_8_characters") },
      { key: "uppercase", label: t("one_uppercase_letter") },
      { key: "number", label: t("one_number") },
      { key: "special", label: t("one_special_character") },
    ],
    [t]
  );

  const passwordsMatch = useMemo(
    () => (!confirmPassword ? true : newPassword === confirmPassword),
    [newPassword, confirmPassword]
  );
  const isNewPasswordStrong = useMemo(
    () => Object.values(passwordChecks).every(Boolean),
    [passwordChecks]
  );
  const canSubmit = Boolean(
    currentPassword && newPassword && confirmPassword && isNewPasswordStrong && passwordsMatch
  );
  const disableSubmit = isSubmitting || !canSubmit;

  const handlePasswordChange = useCallback(async () => {
    setError("");
    setSuccess(false);

    if (!currentPassword) {
      const msg = t("current_password_required");
      setError(`❌ ${msg}`);
      toast.error(msg);
      return;
    }

    if (!isNewPasswordStrong) {
      const msg = t("password_strength_error");
      setError(`❌ ${msg}`);
      toast.error(msg);
      return;
    }

    if (!passwordsMatch) {
      const msg = t("passwords_not_match");
      setError(`❌ ${msg}`);
      toast.error(msg);
      return;
    }

    try {
      setIsSubmitting(true);

      if (user?.role === "Student") {
        await changeStudentPassword({ currentPassword, newPassword });
      } else if (user?.role === "Instructor") {
        await changeInstructorPassword({ currentPassword, newPassword });
      } else if (user?.role === "Admin" || user?.role === "SuperAdmin") {
        await changeAdminPassword({ currentPassword, newPassword });
      } else {
        throw new Error(t("role_not_allowed"));
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success(t("password_updated_login_again"));
      const refreshers = [fetchNotifications, fetchMessages]
        .filter((fn) => typeof fn === "function")
        .map((fn) => fn());
      if (refreshers.length) {
        await Promise.allSettled(refreshers);
      }
      setTimeout(() => {
        router.replace("/auth/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || err.message || t("password_update_failed");
      setError(`❌ ${msg}`);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentPassword,
    newPassword,
    passwordsMatch,
    isNewPasswordStrong,
    user,
    fetchNotifications,
    fetchMessages,
    t,
    router,
  ]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (isSubmitting) return;
      await handlePasswordChange();
    },
    [handlePasswordChange, isSubmitting]
  );

  const goBack = useCallback(() => {
    if (typeof prevStep === "function") {
      prevStep();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/profile");
    }
  }, [prevStep, router]);

  const passwordInput = useCallback(
    (label, value, setValue, key, options = {}) => {
      const {
        autoComplete = "off",
        helperText,
        isError: helperIsError = false,
        minLength,
        required = true,
      } = options;
      const inputId = `${key}-password-input`;
      const helperId = helperText ? `${key}-helper` : undefined;
      const hasError = helperIsError;
      return (
        <div className="mb-4" key={key}>
          <label className="block text-sm font-medium" htmlFor={inputId}>
            {label}
          </label>
          <div className="relative">
            <input
              id={inputId}
              type={showPassword[key] ? "text" : "password"}
              className={`w-full p-3 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 ${
                hasError
                  ? "border border-red-500 focus:ring-red-500"
                  : "border border-gray-600 focus:ring-yellow-500"
              }`}
              value={value}
              autoComplete={autoComplete}
              minLength={minLength}
              required={required}
              aria-invalid={hasError}
              aria-describedby={helperId}
              placeholder={label}
              onChange={(e) => {
                if (error) setError("");
                if (success) setSuccess(false);
                setValue(e.target.value);
              }}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
              onClick={() =>
                setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              aria-label={showPassword[key] ? tCommon("hide") : tCommon("show")}
            >
              {showPassword[key] ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {helperText ? (
            <p
              id={helperId}
              className={`mt-1 text-xs ${
                hasError ? "text-red-400" : "text-gray-400"
              }`}
            >
              {helperText}
            </p>
          ) : null}
        </div>
      );
    },
    [showPassword, error, success, tCommon]
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col">
      <Navbar />

      <main className="flex flex-grow justify-center items-center pt-28 mb-16">
        <motion.div
          className="max-w-3xl w-full bg-gray-800 p-6 rounded-lg shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} noValidate>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-yellow-500">
              <FaLock /> {tCommon("change_password")}
            </h2>

            {passwordInput(t("current_password"), currentPassword, setCurrentPassword, "current", {
              autoComplete: "current-password",
            })}
            {passwordInput(t("new_password"), newPassword, setNewPassword, "new", {
              autoComplete: "new-password",
              minLength: 8,
            })}

            <div className="mb-4">
              <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-300">
                  <FaLock className="text-yellow-500" /> {t("password_requirements")}
                </p>
                <ul className="space-y-2">
                  {passwordRequirementItems.map((item) => {
                    const met = passwordChecks[item.key];
                    return (
                      <li
                        key={item.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        {met ? (
                          <FaCheckCircle className="text-green-400" />
                        ) : (
                          <FaTimesCircle className="text-red-400" />
                        )}
                        <span className={met ? "text-green-300" : "text-gray-300"}>
                          {item.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {passwordInput(
              t("confirm_new_password"),
              confirmPassword,
              setConfirmPassword,
              "confirm",
              {
                autoComplete: "new-password",
                helperText:
                  confirmPassword && !passwordsMatch ? t("passwords_not_match") : "",
                isError: Boolean(confirmPassword && !passwordsMatch),
              }
            )}

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-600 p-3 text-white">
                <FaExclamationTriangle /> {error}
              </div>
            )}

            {success && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-600 p-3 text-white">
                <FaCheckCircle /> {t("password_updated_redirecting")}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-gray-600 px-5 py-2 text-white transition hover:bg-gray-700"
                onClick={goBack}
              >
                <FaArrowLeft /> {tCommon("back")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-yellow-500 px-5 py-2 text-lg font-bold text-gray-900 transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disableSubmit}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <FaSpinner className="animate-spin" />
                    {t("updating")}
                  </span>
                ) : (
                  t("update_password")
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default ChangePasswordPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'auth'], nextI18NextConfig)),
    },
  };
}
