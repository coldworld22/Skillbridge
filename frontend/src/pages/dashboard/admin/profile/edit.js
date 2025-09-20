// Reusable Admin Profile Edit Template (Tailwind + API + Zod + Crop + Upload + Modal)
// This is based on the polished UI you implemented — to be used for other roles/forms

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import { toast } from "react-toastify";
import { z, ZodError } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { getUserCountry } from "@/utils/getUserCountry";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import dynamic from "next/dynamic";
import {
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
  FaUserCircle,
  FaTrash,
  FaUpload,
  FaCheck,
} from "react-icons/fa";
import useNotificationStore from "@/store/notifications/notificationStore";
import useAuthStore from "@/store/auth/authStore";
import useMessageStore from "@/store/messages/messageStore";
import {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminAvatar,
  deleteAdminAvatar,
} from "@/services/admin/adminService";
const Cropper = dynamic(() => import("react-easy-crop"), { ssr: false });
import getCroppedImg from "@/utils/cropImage";
import { toSocialLinksArray } from "@/utils/socialLinks";
import { allowedPlatforms } from "@/utils/socialPlatforms";

// Add service imports as needed, e.g., getProfile, updateProfile, uploadAvatar, etc.

export const profileSchema = z.object({
  full_name: z.string().min(3, "full_name_min"),
  email: z.string().email("invalid_email_address"),
  phone: z
    .string()
    .refine((val) => isValidPhoneNumber(val, getUserCountry()), {
      message: "invalid_phone_number",
    }),
  job_title: z.string().min(2, 'job_title_min'),
  department: z.string().min(2, 'department_min'),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "invalid_date" }),
  // Social links validated as URLs; allow empty strings so optional fields don't fail validation
  // Additionally ensure provided keys correspond to allowed platforms
  socialLinks: z
    .record(z.string().url("url_invalid").or(z.literal("")))
    .refine(
      (links) =>
        Object.keys(links).every((key) =>
          allowedPlatforms.some((p) => p.name === key)
        ),
      {
        message: "invalid_social_platform",
      }
    )
    .optional(),
});

function ProfileEditTemplate() {
  const router = useRouter();
  const { t, i18n, ready } = useTranslation("dashboard", {
    keyPrefix: "adminProfilePage",
  });
  const { user, hasHydrated, setUser } = useAuthStore();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    avatar_url: null,
    avatarPreview: null,
    job_title: "",
    department: "",
    socialLinks: {},
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [expanded, setExpanded] = useState({ personal: true, social: true });
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [tempFileName, setTempFileName] = useState("");
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return undefined;
    }

    let isMounted = true;
    const controller = new AbortController();

    if (!user) {
      setLoadingProfile(false);
      return () => {
        isMounted = false;
        controller.abort();
      };
    }

    const role = user.role?.toLowerCase();
    if (role !== "admin" && role !== "superadmin") {
      setLoadingProfile(false);
      return () => {
        isMounted = false;
        controller.abort();
      };
    }

    setFormData((prev) => ({
      ...prev,
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      gender: user.gender || "male",
      date_of_birth: user.date_of_birth?.split("T")[0] || "",
      avatar_url: user.avatar_url,
      avatarPreview: user.avatar_url
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${user.avatar_url}`
        : null,
      job_title: user.job_title || "",
      department: user.department || "",
    }));

    const loadProfile = async () => {
      setLoadingProfile(true);

      try {
        const res = await getAdminProfile({ signal: controller.signal });
        if (!isMounted) return;

        const {
          full_name,
          email,
          phone,
          gender,
          date_of_birth,
          avatar_url,
          job_title,
          department,
          social_links,
        } = res;

        const socialMap = {};
        social_links?.forEach((link) => {
          if (allowedPlatforms.some((p) => p.name === link.platform)) {
            socialMap[link.platform] = link.url;
          }
        });

        setFormData((prev) => ({
          ...prev,
          full_name,
          email: email || "",
          phone: phone || "",
          gender: gender || "male",
          date_of_birth: date_of_birth?.split("T")[0] || "",
          avatar_url,
          avatarPreview: avatar_url
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${avatar_url}`
            : null,
          job_title: job_title || "",
          department: department || "",
          socialLinks: socialMap,
        }));
      } catch (err) {
        if (err?.name === "AbortError") return;
        toast.error(t("load_profile_failed"));
        console.error("Profile load error:", err);
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [hasHydrated, t, user]);


  const trimValue = (val) => (typeof val === "string" ? val.trim() : val);

  useEffect(() => {
    return () => {
      if (tempAvatar) {
        URL.revokeObjectURL(tempAvatar);
      }
    };
  }, [tempAvatar]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: trimValue(value) }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: trimValue(value) },
    }));
  };

  const onCropComplete = useCallback((_, area) => {
    setCroppedAreaPixels(area);
  }, []);

  const isReady = mounted && hasHydrated && ready;

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      e.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error(t("invalid_image_type"));
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("avatar_max_size"));
      e.target.value = "";
      return;
    }
    if (tempAvatar) {
      URL.revokeObjectURL(tempAvatar);
    }
    setTempFileName(file.name);
    setTempAvatar(URL.createObjectURL(file));
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setShowCropper(true);
    e.target.value = "";
  };

  const handleCropUpload = async () => {
    if (!tempAvatar || !croppedAreaPixels) return;
    if (!user?.id) {
      toast.error(t("user_not_loaded"));
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const blob = await getCroppedImg(tempAvatar, croppedAreaPixels);
      const file = new File([blob], tempFileName || "avatar.jpg", {
        type: blob.type,
      });
      const res = await uploadAdminAvatar(user.id, file);
      setUser({ ...user, avatar_url: res.avatar_url });
      const cacheBust = Date.now();
      setFormData((prev) => ({
        ...prev,
        avatar_url: res.avatar_url,
        avatarPreview: `${process.env.NEXT_PUBLIC_API_BASE_URL}${res.avatar_url}?v=${cacheBust}`,
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
      toast.error(t("user_not_loaded"));
      return;
    }
    setIsRemovingAvatar(true);
    try {
      await deleteAdminAvatar(user.id);
      setUser({ ...user, avatar_url: null });
      setFormData((prev) => ({ ...prev, avatarPreview: null, avatar_url: null }));
      toast.success(t("avatar_remove_success"));
    } catch (error) {
      console.error("Avatar delete error:", error.response);
      const msg = error.response?.data?.message || t("avatar_remove_failed");
      toast.error(msg);
    } finally {
      setIsRemovingAvatar(false);
    }
  };


  const validateForm = () => {
    try {
      profileSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors = {};
        err.errors.forEach((error) => {
          const key = error.path.join(".");
          newErrors[key] = t(error.message);
        });
        setErrors(newErrors);
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

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const social_links = toSocialLinksArray(formData.socialLinks);

      await updateAdminProfile({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        avatar_url: formData.avatar_url,
        job_title: formData.job_title,
        department: formData.department,
        social_links,
      });

      const fresh = await getAdminProfile();
      setUser({
        ...user,
        full_name: fresh.full_name,
        email: fresh.email,
        phone: fresh.phone,
        gender: fresh.gender,
        date_of_birth: fresh.date_of_birth,
        avatar_url: fresh.avatar_url,
        profile_complete: fresh.profile_complete,
        job_title: fresh.job_title,
        department: fresh.department,
      });

      setFormData((prev) => ({
        ...prev,
        avatar_url: fresh.avatar_url,
        email: fresh.email || "",
        job_title: fresh.job_title || "",
        department: fresh.department || "",
        avatarPreview: fresh.avatar_url
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${fresh.avatar_url}`
          : null,
        socialLinks: (fresh.social_links || []).reduce((acc, cur) => {
          acc[cur.platform] = cur.url;
          return acc;
        }, {}),
      }));

      toast.success(t('profile_update_success'));
      await fetchNotifications();
      await fetchMessages();
      router.push("/dashboard/admin/profile/steps/verification");
    } catch (err) {
      const responseData = err?.response?.data;
      const backendErrors = Array.isArray(responseData?.errors)
        ? responseData.errors
        : [];

      if (backendErrors.length) {
        const formattedErrors = backendErrors.reduce((acc, current) => {
          if (current?.field) {
            acc[current.field] = current?.message || t('fix_errors');
          }
          return acc;
        }, {});

        setErrors((prev) => ({
          ...prev,
          ...formattedErrors,
        }));
      }

      const fallbackMessage = t('profile_update_failed');
      const errorMessage =
        (typeof responseData === 'string'
          ? responseData
          : responseData?.message) || err?.message || fallbackMessage;

      toast.error(errorMessage);
      console.error("Profile update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!isReady || loadingProfile) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-yellow-600" />
      </div>
    );
  }

  return (

    <>
      <div className="max-w-5xl mx-auto p-6" dir={i18n.dir()}>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('title')}</h1>
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUserCircle className="text-yellow-600" /> {t('profile_picture')}
            </h2>
            <div className="flex flex-col items-center">
              {formData.avatarPreview ? (
                <div className="relative mb-4">
                  <img
                    src={formData.avatarPreview}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-2 border-yellow-200"
                  />
                  <button
                    onClick={handleAvatarRemove}
                    disabled={isRemovingAvatar}
                    className={`absolute -top-2 -right-2 p-1 rounded-full text-white transition-colors ${
                      isRemovingAvatar
                        ? 'bg-red-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isRemovingAvatar ? (
                      <FaSpinner className="animate-spin" size={14} />
                    ) : (
                      <FaTrash size={14} />
                    )}
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
                  <FaUserCircle size={48} className="text-gray-400" />
                </div>
              )}
              <label
                className={
                  user?.id
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-50"
                }
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  disabled={!user?.id}
                />
                <div className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2">
                  {isUploadingAvatar ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaUpload />
                  )}
                  {formData.avatarPreview ? t('change_photo') : t('upload_photo')}
                </div>
              </label>
              <p className="mt-2 text-xs text-gray-500">{t('avatar_hint')}</p>
              {!user?.id && (
                <p className="text-sm text-gray-500 mt-2">{t('user_not_loaded')}</p>
              )}
            </div>
          </div>

          {/* Personal Section */}
          <div className="bg-white border rounded-xl shadow">
            <div
              className="flex justify-between items-center p-4 border-b cursor-pointer"
              onClick={() => setExpanded((prev) => ({ ...prev, personal: !prev.personal }))}
            >
              <h2 className="text-lg font-semibold text-gray-800">{t('personal_information')}</h2>
              {expanded.personal ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            {expanded.personal && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('full_name')} *</label>
                  <input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.full_name ? "border-red-500" : "border-gray-300"} rounded-md`}
                  />
                  {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('email')} *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.email ? "border-red-500" : "border-gray-300"} rounded-md`}
                  />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('phone')} *</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-md`}
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('job_title')} *</label>
                  <input
                    name="job_title"
                    value={formData.job_title}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.job_title ? "border-red-500" : "border-gray-300"} rounded-md`}
                  />
                  {errors.job_title && (
                    <p className="text-sm text-red-500 mt-1">{errors.job_title}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('department')} *</label>
                  <input
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.department ? "border-red-500" : "border-gray-300"} rounded-md`}
                  />
                  {errors.department && (
                    <p className="text-sm text-red-500 mt-1">{errors.department}</p>
                  )}
                </div>
                {/* Gender and DOB */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t('gender')} *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="other">{t('other')}</option>
                    <option value="prefer-not-to-say">{t('prefer_not_to_say')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t('date_of_birth')} *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.date_of_birth ? "border-red-500" : "border-gray-300"} rounded-md`}
                  />
                  {errors.date_of_birth && <p className="text-sm text-red-500 mt-1">{errors.date_of_birth}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Social Section */}
          <div className="bg-white border rounded-xl shadow">
            <div
              className="flex justify-between items-center p-4 border-b cursor-pointer"
              onClick={() => setExpanded((prev) => ({ ...prev, social: !prev.social }))}
            >
              <h2 className="text-lg font-semibold text-gray-800">{t('social_links')}</h2>
              {expanded.social ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            {expanded.social && (
              <div className="p-4 space-y-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {allowedPlatforms.map(({ name, Icon, className }) => (
                  <div key={name}>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Icon className={`${className} w-4 h-4`} />
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </label>
                    <input
                      type="text"
                      name={name}
                      value={formData.socialLinks[name] || ""}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          socialLinks: { ...prev.socialLinks, [name]: e.target.value.trim() },
                        }));
                        setErrors((prev) => ({ ...prev, [`socialLinks.${name}`]: null }));
                      }}
                      placeholder={
                        name === 'website'
                          ? 'https://yourwebsite.com'
                          : `https://${name}.com/yourprofile`
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    {errors[`socialLinks.${name}`] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors[`socialLinks.${name}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium text-white ${isSubmitting ? 'bg-yellow-400' : 'bg-yellow-600 hover:bg-yellow-700'}`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" /> {t('processing')}
                </span>
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
    </>
  );
}

ProfileEditTemplate.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedProfileEdit = withAuthProtection(ProfileEditTemplate, [
  "admin",
  "superadmin",
]);

ProtectedProfileEdit.getLayout = ProfileEditTemplate.getLayout;

export default ProtectedProfileEdit;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
