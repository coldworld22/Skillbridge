import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { z, ZodError } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { getUserCountry } from "@/utils/getUserCountry";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import StudentLayout from "@/components/layouts/StudentLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import {
  getStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
  uploadStudentIdentity,
  deleteStudentAvatar,
} from "@/services/student/studentService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import logger from "@/utils/logger";
import { toSocialLinksArray } from "@/utils/socialLinks";
import { allowedPlatforms, defaultPlatformIcon } from "@/utils/socialPlatforms";
import { buildUrl } from "@/utils/url";
import {
  FaUpload, FaTrash, FaFilePdf, FaSpinner,
  FaUserCircle, FaIdCard, FaGlobe,
  FaChevronDown, FaChevronUp, FaTimesCircle, FaGraduationCap,
  FaCheck
} from "react-icons/fa";
const Cropper = dynamic(() => import("react-easy-crop"), { ssr: false });
import getCroppedImg from "@/utils/cropImage";

export const studentProfileSchema = z.object({
  full_name: z.string().min(3, "full_name_min"),
  phone: z.string().refine((val) => isValidPhoneNumber(val, getUserCountry()), {
    message: "invalid_phone",
  }),
  gender: z.enum(['male', 'female']),
  date_of_birth: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "invalid_date",
  }),
  education_level: z.string().min(2, "education_required"),
  topics: z.array(z.string()).optional(),
  learning_goals: z.string().optional(),
  // Social links validated as URLs but allow empty strings for optional entries
  socialLinks: z
    .record(z.string().url("url_invalid").or(z.literal("")))
    .optional(),
});

const safeString = (value, fallback = "") => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  try {
    return String(value);
  } catch (err) {
    return fallback;
  }
};

const normalizeTopics = (value) => {
  const toTrimmedArray = (arr) =>
    arr
      .map((item) => safeString(item).trim())
      .filter((item) => item.length > 0);

  if (!value) return [];

  if (Array.isArray(value)) {
    return toTrimmedArray(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return toTrimmedArray(parsed);
      }
    } catch (err) {
      // Ignore JSON parse errors and treat as comma-separated string
    }

    return toTrimmedArray(trimmed.split(","));
  }

  return toTrimmedArray([value]);
};

export default function StudentProfileEdit() {
  const { t } = useTranslation('dashboard', { keyPrefix: 'studentProfilePage' });
  const router = useRouter();
  const { user, logout, hasHydrated, setUser, refreshUser } = useAuthStore();
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingIdentity, setIsUploadingIdentity] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [expanded, setExpanded] = useState({
    avatar: true,
    identity: true,
    personal: true,
    education: true,
    social: true
  });
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    education_level: "",
    topics: [],
    learning_goals: "",
    socialLinks: {},
    avatar_url: null,
    avatarPreview: null,
    identityFile: null,
    identityPreview: null,
    identityPreviewIsBlob: false,
  });
  const [errors, setErrors] = useState({});
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [tempFileName, setTempFileName] = useState("");

  const translateValidationMessage = useCallback(
    (key) => {
      if (!key) return "";
      const nested = t(`validation.${key}`, { defaultValue: "" });
      if (typeof nested === "string" && nested.trim().length > 0) {
        return nested;
      }
      const direct = t(key, { defaultValue: "" });
      if (typeof direct === "string" && direct.trim().length > 0) {
        return direct;
      }
      return key;
    },
    [t]
  );

  useEffect(() => {
    if (!hasHydrated) return;

    if (!user) {
      // No logged in user – stop loading to avoid endless spinner
      setIsLoading(false);
      return;
    }

    if (user.role?.toLowerCase() !== "student") {
      // Logged in but not a student; redirect to a safe dashboard
      router.push("/dashboard");
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await getStudentProfile();
        const { full_name, phone, gender, date_of_birth, avatar_url, student, social_links } = res;

        const socialMap = {};
        social_links?.forEach((link) => {
          if (allowedPlatforms.some((p) => p.name === link.platform)) {
            socialMap[link.platform] = link.url;
          }
        });

        const identityDocUrl = student?.identity_doc_url;

        setFormData({
          full_name: full_name ?? "",
          phone: phone ?? "",
          gender: gender || "male",
          date_of_birth: date_of_birth?.split("T")[0] || "",
          education_level: student?.education_level || "",
          topics: normalizeTopics(student?.topics),
          learning_goals: student?.learning_goals || "",
          socialLinks: socialMap,
          avatar_url,
          avatarPreview: avatar_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${avatar_url}` : null,
          identityFile: null,
          identityPreview: identityDocUrl
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${identityDocUrl}`
            : null,
          identityPreviewIsBlob: false,
        });
      } catch (err) {
        toast.error(t('load_failed'));
        console.error("Profile load error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user, hasHydrated, router]);

  useEffect(() => {
    return () => {
      if (formData.identityPreview && formData.identityPreviewIsBlob) {
        URL.revokeObjectURL(formData.identityPreview);
      }
    };
  }, [formData.identityPreview, formData.identityPreviewIsBlob]);

  const toggleSection = (section) => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value.trim() }
    }));
    setErrors(prev => ({ ...prev, [`socialLinks.${name}`]: null }));
  };

  const onCropComplete = useCallback((_, area) => {
    setCroppedAreaPixels(area);
  }, []);

const handleAvatarSelect = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast.error(t('avatar_invalid_type'));
    e.target.value = "";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.error(t('image_size_error'));
    return;
  }
  setTempFileName(file.name);
  setTempAvatar(URL.createObjectURL(file));
  setShowCropper(true);
};

  const handleCropUpload = async () => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      if (!tempAvatar || !croppedAreaPixels) return;
      const blob = await getCroppedImg(tempAvatar, croppedAreaPixels);
      const file = new File([blob], tempFileName || "avatar.jpg", { type: blob.type });
      const res = await uploadStudentAvatar(user.id, file);
      const avatar_url = res.avatar_url;
      setUser({ ...user, avatar_url });
      setFormData(prev => ({
        ...prev,
        avatar_url,
        avatarPreview: `${process.env.NEXT_PUBLIC_API_BASE_URL}${avatar_url}?v=${Date.now()}`
      }));
      toast.success(t('avatar_upload_success'));
      setShowCropper(false);
      setTempAvatar(null);
    } catch (error) {
      console.error('Avatar upload error:', error.response);
      const msg = error.response?.data?.message || t('avatar_upload_failed');
      toast.error(msg);
    } finally {
      if (tempAvatar) {
        URL.revokeObjectURL(tempAvatar);
      }
      setIsUploadingAvatar(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    if (tempAvatar) URL.revokeObjectURL(tempAvatar);
    setTempAvatar(null);
    setCroppedAreaPixels(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleAvatarRemove = async () => {
    if (!user?.id) {
      toast.error(t('user_not_loaded'));
      return;
    }

    if (!formData.avatar_url) {
      setFormData((prev) => ({
        ...prev,
        avatar_url: null,
        avatarPreview: null,
      }));
      toast.success(t('avatar_remove_success'));
      return;
    }

    setIsDeletingAvatar(true);
    try {
      await deleteStudentAvatar(user.id);
      await refreshUser?.();
      setFormData((prev) => ({
        ...prev,
        avatar_url: null,
        avatarPreview: null,
      }));
      toast.success(t('avatar_remove_success'));
    } catch (error) {
      logger.error('Avatar remove error:', error);
      const message = error?.response?.data?.message || t('avatar_remove_failed');
      toast.error(message);
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const handleIdentityUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error(t('pdf_only_error'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('pdf_size_error'));
      return;
    }
    try {
      setIsUploadingIdentity(true);
      if (!user) return;
      await uploadStudentIdentity(user.id, file);
      setFormData(prev => {
        if (prev.identityPreview && prev.identityPreviewIsBlob) {
          URL.revokeObjectURL(prev.identityPreview);
        }
        return {
          ...prev,
          identityFile: file,
          identityPreview: URL.createObjectURL(file),
          identityPreviewIsBlob: true,
        };
      });
      toast.success(t('id_upload_success'));
    } catch (err) {
      toast.error(t('id_upload_failed'));
    } finally {
      setIsUploadingIdentity(false);
    }
  };

  const removeIdentity = () => {
    setFormData(prev => {
      if (prev.identityPreview && prev.identityPreviewIsBlob) {
        URL.revokeObjectURL(prev.identityPreview);
      }
      return {
        ...prev,
        identityFile: null,
        identityPreview: null,
        identityPreviewIsBlob: false,
      };
    });
  };

  const validateForm = () => {
    try {
      const sanitizedLinks = Object.fromEntries(
        Object.entries(formData.socialLinks || {}).filter(
          ([platform, url]) =>
            allowedPlatforms.some((p) => p.name === platform) && url.trim() !== ""
        )
      );

      studentProfileSchema.parse({
        ...formData,
        socialLinks: Object.keys(sanitizedLinks).length ? sanitizedLinks : undefined,
      });
      setErrors({});
      return true;
    } catch (err) {
      const errs = {};
      if (err instanceof ZodError) {
        err.errors.forEach((error) => {
          const key = error.path.join(".");
          errs[key] = translateValidationMessage(error.message);
        });
        setErrors(errs);
        if (err.errors?.length) {
          toast.error(translateValidationMessage(err.errors[0].message));
        } else {
          toast.error(t('fix_errors'));
        }
      } else {
        toast.error(t('fix_errors'));
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!user) {
      toast.error(t('user_not_loaded'));
      return;
    }
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      logger.log("[StudentProfileEdit] Submitting form", formData);
      const social_links = toSocialLinksArray(formData.socialLinks);

      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        education_level: formData.education_level,
        topics: normalizeTopics(formData.topics),
        learning_goals: formData.learning_goals,
        social_links,
      };
      logger.log("[StudentProfileEdit] Payload", payload);

      await toast.promise(updateStudentProfile(payload), {
        pending: t('saving_profile'),
        success: t('update_success'),
        error: {
          render({ data }) {
            return (
              data?.response?.data?.message ||
              data?.message ||
              t('update_failed')
            );
          },
        },
      });

      const fresh = await getStudentProfile();
      logger.log("[StudentProfileEdit] Updated profile", fresh);

      setUser({
        ...user,
        full_name: fresh.full_name,
        phone: fresh.phone,
        gender: fresh.gender,
        date_of_birth: fresh.date_of_birth,
        avatar_url: fresh.avatar_url,
        profile_complete: fresh.profile_complete,
      });

      setTimeout(() => {
        router.push("/dashboard/student/profile/steps/Verification");
      }, 1500);

      try {
        const message = t('profile_update_notification');
        await Promise.all([
          createNotification({ user_id: user.id, type: "profile_update", message }),
          sendChatMessage(user.id, { text: message }),
        ]);
        refreshNotifications?.();
        refreshMessages?.();
      } catch (err) {
        logger.error("[StudentProfileEdit] notification error", err);
      }





    } catch (err) {
      logger.error("[StudentProfileEdit] update error", err);
      const msg = err.response?.data?.message || err.message || t('update_failed');
      toast.error(msg);
      if (err.response?.status === 401) {
        toast.error(t('session_expired'));
        logout();
        router.push("/auth/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasHydrated || isLoading) {
    return (
      <StudentLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-yellow-600" />
        </div>
      </StudentLayout>
    );
  }
  return (
    <StudentLayout>
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">{t('title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Avatar and Identity */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Picture Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                onClick={() => toggleSection('avatar')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                    <FaUserCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('profile_picture')}</h2>
                </div>
                {expanded.avatar ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.avatar && (
                <div className="p-4 space-y-4">
                  <div className="flex flex-col items-center">
                    {formData.avatarPreview ? (
                      <div className="relative">
                        <img
                          src={formData.avatarPreview}
                          alt="Avatar Preview"
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <button
                          type="button"
                          onClick={handleAvatarRemove}
                          disabled={isDeletingAvatar}
                          className={`absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full transition-colors ${
                            isDeletingAvatar ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
                          }`}
                        >
                          {isDeletingAvatar ? (
                            <FaSpinner className="w-4 h-4 animate-spin" />
                          ) : (
                            <FaTimesCircle className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                        <FaUserCircle className="w-16 h-16" />
                      </div>
                    )}

                    <label className="mt-4 cursor-pointer">
                      <div className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2">
                        <FaUpload className="w-4 h-4" />
                        <span>{formData.avatarPreview ? t('change_photo') : t('upload_photo')}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-2 text-xs text-gray-500">{t('avatar_hint')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Identity Verification Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                onClick={() => toggleSection('identity')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <FaIdCard className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('student_id')}</h2>
                </div>
                {expanded.identity ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.identity && (
                <div className="p-4 space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {isUploadingIdentity ? (
                      <div className="flex justify-center">
                        <FaSpinner className="w-6 h-6 text-purple-600 animate-spin" />
                      </div>
                    ) : formData.identityPreview ? (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full">
                          <FaFilePdf className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">{t('id_uploaded')}</p>
                        <div className="flex justify-center space-x-3">
                          <a
                            href={formData.identityPreview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-md text-sm hover:bg-yellow-100 transition-colors flex items-center space-x-1"
                          >
                            <FaFilePdf className="w-3 h-3" />
                            <span>{t('view_pdf')}</span>
                          </a>
                          <button
                            onClick={removeIdentity}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100 transition-colors flex items-center space-x-1"
                          >
                            <FaTrash className="w-3 h-3" />
                            <span>{t('remove')}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full">
                          {isUploadingIdentity ? (
                            <FaSpinner className="w-6 h-6 text-gray-500 animate-spin" />
                          ) : (
                            <FaUpload className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-700">{t('upload_id')}</p>
                        <p className="text-xs text-gray-500">{t('pdf_hint')}</p>
                        <label className={`cursor-pointer inline-block mt-2 ${isUploadingIdentity ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <div className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                            {isUploadingIdentity ? <FaSpinner className="w-4 h-4 animate-spin" /> : <FaUpload className="w-4 h-4" />}
                            <span>{t('select_file')}</span>
                          </div>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleIdentityUpload}
                            className="hidden"
                            disabled={isUploadingIdentity}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('upload_id_note')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                onClick={() => toggleSection('personal')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                    <FaUserCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('personal_section')}</h2>
                </div>
                {expanded.personal ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.personal && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('full_name_label')}</label>
                      <input
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        placeholder={t('full_name_placeholder')}
                        className={`w-full px-3 py-2 border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                      />
                      {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone_label')}</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={t('phone_placeholder')}
                        className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('gender_label')}</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="male">{t('male')}</option>
                        <option value="female">{t('female')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('dob_label')}</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                      />
                      {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Education Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                onClick={() => toggleSection('education')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <FaGraduationCap className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('education_section')}</h2>
                </div>
                {expanded.education ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.education && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('education_level_label')}</label>
                    <input
                      name="education_level"
                      value={formData.education_level}
                      onChange={handleInputChange}
                      placeholder={t('education_level_placeholder')}
                      className={`w-full px-3 py-2 border ${errors.education_level ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                    />
                    {errors.education_level && <p className="mt-1 text-sm text-red-600">{errors.education_level}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('learning_goals_label')}</label>
                    <textarea
                      name="learning_goals"
                      value={formData.learning_goals}
                      onChange={handleInputChange}
                      placeholder={t('learning_goals_placeholder')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Social Links Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
                onClick={() => toggleSection('social')}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                    <FaGlobe className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('social_section')}</h2>
                </div>
                {expanded.social ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.social && (
                <div className="p-4 space-y-4">
                  {allowedPlatforms.map(({ name, Icon, className }) => {
                    const IconComponent = Icon || defaultPlatformIcon.Icon;
                    if (!IconComponent) {
                      return null;
                    }
                    const iconClassName = className || defaultPlatformIcon.className;

                    return (
                      <div key={name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                          <IconComponent className={`w-4 h-4 mr-2 ${iconClassName}`} />
                          {t(`${name}_label`)}
                        </label>
                        <input
                          type="text"
                          name={name}
                          value={formData.socialLinks[name] || ""}
                          onChange={handleSocialChange}
                          placeholder={t(`${name}_placeholder`)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                        {errors[`socialLinks.${name}`] && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors[`socialLinks.${name}`]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/student")}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium text-white ${isSubmitting ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 transition-colors'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    {t('saving')}
                  </span>
                ) : (
                  t('save_changes')
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
      {showCropper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="bg-white p-4 rounded-lg w-80 sm:w-96">
            <div className="relative w-full h-64">
              <Cropper
                image={tempAvatar}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleCropCancel}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCropUpload}
                className="px-4 py-2 bg-yellow-600 text-white rounded flex items-center gap-2"
              >
                {isUploadingAvatar ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                {t('upload')}
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentLayout>
  );
}

export default withAuthProtection(StudentProfileEdit, ['student']);

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
