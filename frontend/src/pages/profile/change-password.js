import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaLock, FaEye, FaEyeSlash, FaCheckCircle,
  FaExclamationTriangle, FaArrowLeft, FaSpinner
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
  const { user, accessToken } = useAuthStore.getState();
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);
  const { t } = useTranslation("auth");
  const { t: tCommon } = useTranslation("common");

  useEffect(() => {
    if (!user || !accessToken) {
      toast.error(t('must_be_logged_in'));
      router.replace('/auth/login');
    }
  }, [user, accessToken, t]);

  const handlePasswordChange = async () => {
    setError("");
    setSuccess(false);

    // Password strength check
    if (
      newPassword.length < 5 ||
      !/[A-Z]/.test(newPassword) ||
      !/\d/.test(newPassword) ||
      !/[!@#$%^&*]/.test(newPassword)
    ) {
      const msg = t('password_strength_error');
      setError(`❌ ${msg}`);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = t('passwords_not_match');
      setError(`❌ ${msg}`);
      toast.error(msg);
      return;
    }

    try {
      setIsSubmitting(true);

      if (user.role === "Student") {
        await changeStudentPassword({ currentPassword, newPassword });
      } else if (user.role === "Instructor") {
        await changeInstructorPassword({ currentPassword, newPassword });
      } else if (user.role === "Admin" || user.role === "SuperAdmin") {
        await changeAdminPassword(user.id, newPassword);
      } else {
        throw new Error(t('role_not_allowed'));
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success(t('password_updated_login_again'));
      await fetchNotifications();
      fetchMessages();
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 1500);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message || err.message || t('password_update_failed');
      setError(`❌ ${msg}`);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordInput = (label, value, setValue, key) => (
    <div className="mb-4">
      <label className="block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          type={showPassword[key] ? "text" : "password"}
          className="w-full p-3 border border-gray-600 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          type="button"
          className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
          onClick={() => setShowPassword(prev => ({ ...prev, [key]: !prev[key] }))}
        >
          {showPassword[key] ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </div>
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
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-yellow-500">
            <FaLock /> {tCommon('change_password')}
          </h2>

          {passwordInput(t('current_password'), currentPassword, setCurrentPassword, 'current')}
          {passwordInput(t('new_password'), newPassword, setNewPassword, 'new')}
          {passwordInput(t('confirm_new_password'), confirmPassword, setConfirmPassword, 'confirm')}

          {error && (
            <div className="p-3 bg-red-600 text-white rounded-lg mb-4 flex items-center gap-2">
              <FaExclamationTriangle /> {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-600 text-white rounded-lg mb-4 flex items-center gap-2">
              <FaCheckCircle /> {t('password_updated_redirecting')}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              className="px-5 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
              onClick={prevStep}
            >
              <FaArrowLeft /> {tCommon('back')}
            </button>
            <button
              className="px-5 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-600 transition font-bold text-lg disabled:opacity-50"
              onClick={handlePasswordChange}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <FaSpinner className="animate-spin" />
                  {t('updating')}
                </span>
              ) : (
                t('update_password')
              )}
            </button>
          </div>
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
