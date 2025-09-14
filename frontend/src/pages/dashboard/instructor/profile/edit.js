// ✅ Enhanced Instructor Profile Edit Page
// File: pages/dashboard/instructor/profile/edit.js

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import { toast } from "react-toastify";
import { z, ZodError } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { getUserCountry } from "@/utils/getUserCountry";
import { API_BASE_URL } from "@/config/config";
import { getCurrencies } from "@/services/currencyService";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import { toSocialLinksArray } from "@/utils/socialLinks";
import {
  getInstructorProfile,
  updateInstructorProfile,
  uploadInstructorAvatar,
  uploadInstructorDemo,
  deleteInstructorAvatar,
  deleteInstructorDemo,
  toggleInstructorStatus,
  uploadCertificateFile,
  deleteCertificateFile,
} from "@/services/instructor/instructorService";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import { allowedPlatforms } from "@/utils/socialPlatforms";
import {
  FaSpinner,
  FaDollarSign,
  FaCalendarAlt,
  FaPhone,
  FaVenusMars,
  FaUser,
  FaCheck,
  FaCertificate,
  FaFilePdf,
  FaFileImage,
  FaTrash,
  FaUpload,
  FaPlus,
} from "react-icons/fa";
import { MdOutlineWorkOutline } from "react-icons/md";

import AvatarUploader from "@/components/instructor/profile/AvatarUploader";
import DemoVideoUploader from "@/components/instructor/profile/DemoVideoUploader";
import CertificatesSection from "@/components/instructor/profile/CertificatesSection";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || API_BASE_URL;
export const instructorProfileSchema = (country) => z.object({
  full_name: z.string().min(3, "full_name_min"),
  phone: z
    .string()
    .refine((val) => isValidPhoneNumber(val, getUserCountry()), {
      message: "invalid_phone_number",
    }),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "invalid_date",
  }),
  experience: z.number().min(0, "experience_positive"),
  pricing_amount: z.number().min(0, "amount_positive").optional(),
  pricing_currency: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  bio: z
    .string()
    .optional()
    .refine((val) => !val || val.split(/\s+/).filter(Boolean).length <= 150, {
      message: "bio_max_words",
    }),
  socialLinks: z
    .record(z.string().url("invalid_url").or(z.literal("")))
    .optional(),
})
  .superRefine((data, ctx) => {
    const hasAmount = typeof data.pricing_amount === "number";
    const hasCurrency = !!data.pricing_currency;
    if (hasAmount && !hasCurrency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pricing_currency"],
        message: "pricing_currency_required",
      });
    }
    if (!hasAmount && hasCurrency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pricing_amount"],
        message: "pricing_amount_required",
      });
    }
  });
// Currency options will be loaded from the backend configuration
export default function InstructorProfileEdit() {
  const router = useRouter();
  const { t } = useTranslation('dashboard', { keyPrefix: 'instructorProfilePage' });
  const { user, hasHydrated, setUser } = useAuthStore();
  const fetchNotifications = useNotificationStore((state) => state.fetch);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    experience: 0,
    pricing_amount: undefined,
    pricing_currency: "",
    expertise: [],
    bio: "",
    socialLinks: {},
    certificates: [],
    avatar_url: null,
    avatarPreview: null,
    demoPreview: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingDemo, setIsUploadingDemo] = useState(false);

  const [avatarInputKey, setAvatarInputKey] = useState(0);
  const [demoInputKey, setDemoInputKey] = useState(0);

  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [tempFileName, setTempFileName] = useState("");
  const [currencyOptions, setCurrencyOptions] = useState([]);
  const [available, setAvailable] = useState(user?.is_online ?? false);
  const [newExpertise, setNewExpertise] = useState("");
  const [newCertificate, setNewCertificate] = useState({
    title: "",
    file: null,
    preview: null,
  });
  const [certificateUploading, setCertificateUploading] = useState(false);

  useEffect(() => {
    setAvailable(user?.is_online ?? false);
  }, [user]);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const list = await getCurrencies();
        setCurrencyOptions(list);
        const def = list.find((c) => c.is_default) || list[0];
        if (def) {
          setFormData((prev) => ({
            ...prev,
            pricing_currency: prev.pricing_currency || def.code,
          }));
        }
      } catch (err) {
        console.error("Failed to load currencies", err);
      }
    };
    loadCurrencies();
  }, []);

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "instructor") return;

    const loadProfile = async () => {
      try {
        const res = await getInstructorProfile();
        const { full_name, phone, gender, date_of_birth, avatar_url, instructor, social_links, certificates } = res;

        const socialMap = {};
        social_links?.forEach((link) => {
          if (allowedPlatforms.some((p) => p.name === link.platform)) {
            socialMap[link.platform] = link.url;
          }
        });

        // Split pricing if it exists in format "100 USD"
        let pricing_amount;
        let pricing_currency = "";
        if (instructor?.pricing) {
          const pricingParts = instructor.pricing.split(" ");
          if (pricingParts.length === 2) {
            const amount = parseFloat(pricingParts[0]);
            pricing_amount = isNaN(amount) ? undefined : amount;
            pricing_currency = pricingParts[1] || "";
          }
        }

        let expertiseList = [];
        if (Array.isArray(instructor?.expertise)) {
          expertiseList = instructor.expertise;
        } else if (typeof instructor?.expertise === "string") {
          try {
            expertiseList = JSON.parse(instructor.expertise);
          } catch (_) {
            expertiseList = instructor.expertise
              .split(',')
              .map((e) => e.trim())
              .filter(Boolean);
          }
        }

        setFormData(prev => ({
          ...prev,
          full_name,
          phone,
          gender: gender || "male",
          date_of_birth: date_of_birth?.split("T")[0] || "",
          experience: instructor?.experience ? parseInt(instructor.experience) : 0,
          pricing_amount,
          pricing_currency,
          expertise: expertiseList,
          bio: instructor?.bio || "",
          socialLinks: socialMap,
          certificates: certificates || [],
          avatar_url,
          avatarPreview: avatar_url
            ? `${BASE_URL}${avatar_url}`
            : null,
          demoPreview: instructor?.demo_video_url
            ? `${BASE_URL}${instructor.demo_video_url}`
            : null,
        }));
      } catch (err) {
        toast.error(t('load_profile_failed'));
        console.error("Profile load error:", err);
      }
    };

    loadProfile();
  }, [user]);

  const validateForm = () => {
    try {
      const sanitizedLinks = Object.fromEntries(
        Object.entries(formData.socialLinks || {}).filter(([, url]) => url.trim() !== "")
      );
      instructorProfileSchema(user?.country).parse({
        ...formData,
        socialLinks: Object.keys(sanitizedLinks).length ? sanitizedLinks : undefined,
      });
      setErrors({});
      return true;
    } catch (err) {
      const errs = {};
      if (err instanceof ZodError) {
        err.errors.forEach(error => {
          const key = error.path.join(".");
          errs[key] = t(error.message);
        });
        setErrors(errs);
        if (err.errors?.length) {
          toast.error(t(err.errors[0].message));
        } else {
          toast.error(t('fix_errors'));
        }
      } else {
        toast.error(t('fix_errors'));
      }
      return false;
    }
  };

  const handleDemoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return toast.error(t('demo_max_size'));
    setIsUploadingDemo(true);
    try {
      const res = await uploadInstructorDemo(user.id, file);
      setFormData(prev => ({
        ...prev,
        demoPreview: `${BASE_URL}${res.demo_video_url}`,
      }));
    } catch (error) {
      toast.error(t('demo_upload_failed'));
    } finally {
      setIsUploadingDemo(false);
    }
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
    if (file.size > 10 * 1024 * 1024) return toast.error(t('avatar_max_size'));
    setTempFileName(file.name);
    setTempAvatar(URL.createObjectURL(file));
    setShowCropper(true);
  };

  const handleCropUpload = async () => {
    if (!tempAvatar || !croppedAreaPixels) return;
    setIsUploadingAvatar(true);
    try {
      const blob = await getCroppedImg(tempAvatar, croppedAreaPixels);
      const file = new File([blob], tempFileName || "avatar.jpg", { type: blob.type });
      const res = await uploadInstructorAvatar(user.id, file);
      setUser({ ...user, avatar_url: res.avatar_url });
      setFormData((prev) => ({
        ...prev,
        avatar_url: res.avatar_url,
        avatarPreview: `${BASE_URL}${res.avatar_url}?v=${Date.now()}`,
      }));
      setShowCropper(false);
      URL.revokeObjectURL(tempAvatar);
      setTempAvatar(null);
    } catch (error) {
      console.error('Avatar upload error:', error.response);
      const msg = error.response?.data?.message || t('avatar_upload_failed');
      toast.error(msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setIsUploadingAvatar(true);
    try {
      await deleteInstructorAvatar(user.id);
      setUser({ ...user, avatar_url: null });
      setFormData(prev => ({
        ...prev,
        avatar_url: null,
        avatarPreview: null,
      }));
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        t('avatar_delete_failed', { defaultValue: 'Failed to delete avatar' });
      toast.error(msg);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDemoRemove = async () => {
    setIsUploadingDemo(true);
    try {
      await deleteInstructorDemo(user.id);
      setFormData(prev => ({
        ...prev,
        demoPreview: null,
      }));
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        t('demo_delete_failed', { defaultValue: 'Failed to delete demo video' });
      toast.error(msg);
    } finally {
      setIsUploadingDemo(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);

      // Combine pricing amount and currency
      const pricing =
        typeof formData.pricing_amount === "number" && formData.pricing_currency
          ? `${formData.pricing_amount} ${formData.pricing_currency}`
          : "";
      const social_links = toSocialLinksArray(formData.socialLinks);

      await updateInstructorProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        experience: formData.experience,
        bio: formData.bio,
        pricing,
        expertise: formData.expertise,
        social_links,
      });
      // Fetch the latest profile to ensure data persisted
      const fresh = await getInstructorProfile();

      // Update the auth store with the returned user data
      setUser({
        ...user,
        full_name: fresh.full_name,
        phone: fresh.phone,
        gender: fresh.gender,
        date_of_birth: fresh.date_of_birth,
        avatar_url: fresh.avatar_url,
        profile_complete: fresh.profile_complete,
      });

      // Reflect updates locally
      let freshExpertise = [];
      if (Array.isArray(fresh.instructor?.expertise)) {
        freshExpertise = fresh.instructor.expertise;
      } else if (typeof fresh.instructor?.expertise === "string") {
        try {
          freshExpertise = JSON.parse(fresh.instructor.expertise);
        } catch (_) {
          freshExpertise = fresh.instructor.expertise
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean);
        }
      }

      const defCur = currencyOptions.find((c) => c.is_default) || currencyOptions[0];

      setFormData((prev) => ({
        ...prev,
        full_name: fresh.full_name,
        phone: fresh.phone,
        gender: fresh.gender || "male",
        date_of_birth: fresh.date_of_birth?.split("T")[0] || "",
        expertise: freshExpertise,
        experience: fresh.instructor?.experience || 0,
        bio: fresh.instructor?.bio || "",
        pricing_amount: fresh.instructor?.pricing
          ? (() => {
              const amt = parseFloat(fresh.instructor.pricing.split(" ")[0]);
              return isNaN(amt) ? undefined : amt;
            })()
          : undefined,
        pricing_currency: fresh.instructor?.pricing
          ? fresh.instructor.pricing.split(" ")[1]
          : defCur?.code || "",
        socialLinks: (fresh.social_links || []).reduce((acc, cur) => {
          if (allowedPlatforms.some((p) => p.name === cur.platform)) {
            acc[cur.platform] = cur.url;
          }
          return acc;
        }, {}),
        avatarPreview: fresh.avatar_url
          ? `${BASE_URL}${fresh.avatar_url}`
          : prev.avatarPreview,
      }));

        toast.success(t('profile_update_success'));
      await fetchNotifications();
      router.push("/dashboard/instructor/profile/steps/Verification");
    } catch (err) {
        toast.error(err.message || t('profile_update_failed'));
      console.error("Profile update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasHydrated) return (
    <InstructorLayout>
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-yellow-600" />
      </div>
    </InstructorLayout>
  );

  return (
    <InstructorLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">{t('title')}</h1>
        </div>

        {/* Avatar and Demo Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <AvatarUploader
            key={avatarInputKey}
            avatarPreview={formData.avatarPreview}
            isUploadingAvatar={isUploadingAvatar}
            t={t}
            onSelect={handleAvatarSelect}
            onRemove={handleAvatarRemove}
          />
          <DemoVideoUploader
            key={demoInputKey}
            demoPreview={formData.demoPreview}
            isUploadingDemo={isUploadingDemo}
            t={t}
            onSelect={handleDemoSelect}
            onRemove={handleDemoRemove}
          />
        </div>

        {/* Personal and Professional Info */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
            {t('personal_information')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaUser className="text-gray-500" /> {t('full_name')} *
              </label>
              <input
                name="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className={`w-full px-4 py-2 border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-yellow-500 focus:border-yellow-500`}
                placeholder="John Doe"
              />
              {errors.full_name && <p className="text-sm text-red-600 mt-1">{errors.full_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaPhone className="text-gray-500" /> {t('phone')} *
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-yellow-500 focus:border-yellow-500`}
                placeholder="+1234567890"
              />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaVenusMars className="text-gray-500" /> {t('gender')} *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="male">{t('male')}</option>
                <option value="female">{t('female')}</option>
                <option value="other">{t('other')}</option>
                <option value="prefer-not-to-say">{t('prefer_not_to_say')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaCalendarAlt className="text-gray-500" /> {t('date_of_birth')} *
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className={`w-full px-4 py-2 border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-yellow-500 focus:border-yellow-500`}
              />
          {errors.date_of_birth && <p className="text-sm text-red-600 mt-1">{errors.date_of_birth}</p>}
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium mb-1">{t('bio_max')}</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
        />
        {errors.bio && <p className="text-sm text-red-600 mt-1">{errors.bio}</p>}
      </div>

      <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mt-8">
        {t('professional_information')}
      </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <MdOutlineWorkOutline className="text-gray-500" /> {t('years_of_experience')} *
              </label>
              <input
                type="number"
                min="0"
                name="experience"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                className={`w-full px-4 py-2 border ${errors.experience ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-yellow-500 focus:border-yellow-500`}
              />
              {errors.experience && <p className="text-sm text-red-600 mt-1">{errors.experience}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaCalendarAlt className="text-gray-500" /> {t('availability')}
              </label>
              <button
                type="button"
                onClick={async () => {
                  const newStatus = !available;
                  try {
                    const res = await toggleInstructorStatus(newStatus);
                    const updated = res?.is_online ?? newStatus;
                    setAvailable(updated);
                    setUser({ ...user, is_online: updated });
                  } catch (err) {
                    toast.error(t('availability_update_failed'));
                  }
                }}
                className={`px-4 py-2 rounded-md ${available ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {available ? t('available') : t('unavailable')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaDollarSign className="text-gray-500" /> {t('pricing_per_hour')}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="pricing_amount"
                  value={formData.pricing_amount ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricing_amount:
                        e.target.value === "" ? undefined : parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  placeholder={t('amount_placeholder')}
                />
                <select
                  name="pricing_currency"
                  value={formData.pricing_currency}
                  onChange={(e) => setFormData({ ...formData, pricing_currency: e.target.value })}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label} {option.symbol ? `(${option.symbol})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              {errors.pricing_amount && (
                <p className="text-sm text-red-600 mt-1">{errors.pricing_amount}</p>
              )}
              {errors.pricing_currency && (
                <p className="text-sm text-red-600 mt-1">{errors.pricing_currency}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">e.g. 100 USD per hour</p>
            </div>
          </div>

          {/* Expertise List */}
          <ExpertiseList
            expertise={formData.expertise}
            onChange={(updated) =>
              setFormData({ ...formData, expertise: updated })
            }
            t={t}
          />

          {/* Certificates Section */}
          <CertificatesSection
            certificates={formData.certificates}
            onChange={(updated) =>
              setFormData({ ...formData, certificates: updated })
            }
            t={t}
            baseUrl={BASE_URL}
          />

          <SocialLinksSection
            socialLinks={formData.socialLinks}
            onChange={(links) => {
              setFormData((prev) => ({ ...prev, socialLinks: links }));
              setErrors((prev) => {
                const updated = { ...prev };
                Object.keys(links).forEach((name) => {
                  delete updated[`socialLinks.${name}`];
                });
                return updated;
              });
            }}
            t={t}
          />

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> {t('upload') + '...'}
                </>
              ) : (
                t('save_changes')
              )}
            </button>
          </div>
        </div>
      </div>
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
                onClick={() => {
                  setShowCropper(false);
                  if (tempAvatar) URL.revokeObjectURL(tempAvatar);
                  setTempAvatar(null);
                }}
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
    </InstructorLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}