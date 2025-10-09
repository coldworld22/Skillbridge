// Reusable Admin Profile Edit Template (Tailwind + API + Zod + Crop + Upload + Modal)
// This is based on the polished UI you implemented — to be used for other roles/forms

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import { toast } from "react-toastify";
import { z } from "zod";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
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
} from "@/services/admin/adminService";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";

// Add service imports as needed, e.g., getProfile, updateProfile, uploadAvatar, etc.

const MAX_UPLOAD_SIZE_MB = 20;
const MAX_AVATAR_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

const profileSchema = z.object({
  full_name: z.string().min(3, "full_name_min"),
  email: z.string().email("invalid_email_address"),
  phone: z.string().min(8, "phone_min"),
  job_title: z.string().min(2),
  department: z.string().min(2),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "invalid_date" }),
  // Social links are optional strings without URL validation
  socialLinks: z.record(z.string()).optional(),
});

function ProfileEditTemplate() {
  const router = useRouter();
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'adminProfilePage' });
  const { user, hasHydrated, setUser } = useAuthStore();
  const [loadingProfile, setLoadingProfile] = useState(true);
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
  const local = localStorage.getItem("auth");
  const parsed = JSON.parse(local)?.state;
  if (hasHydrated && !user && parsed?.user) {
    setUser(parsed.user);
  }
}, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    const role = user.role?.toLowerCase();
    if (role !== "admin" && role !== "superadmin") {
      setLoadingProfile(false);
      return;
    }

    // Pre-fill with existing user info while fetching latest data
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
      try {
        setLoadingProfile(true);

        const res = await getAdminProfile();
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
          socialMap[link.platform] = link.url;
        });

        setFormData((prev) => ({
          ...prev,
          full_name,
          email: email || "",
          phone,
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
        toast.error(t('load_profile_failed'));
        console.error("Profile load error:", err);
      } finally {
        setLoadingProfile(false);

      }
    };

    loadProfile();
  }, [hasHydrated, user]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const onCropComplete = useCallback((_, area) => {
    setCroppedAreaPixels(area);
  }, []);

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t('avatar_max_size', { size: MAX_UPLOAD_SIZE_MB }));
      return;
    }
    setTempFileName(file.name);
    setTempAvatar(URL.createObjectURL(file));
    setShowCropper(true);
  };

  const handleCropUpload = async () => {
    if (!tempAvatar || !croppedAreaPixels) return;
    setIsSubmitting(true);
    try {
      const blob = await getCroppedImg(tempAvatar, croppedAreaPixels);
      if (blob.size > MAX_AVATAR_BYTES) {
        toast.error(t('avatar_max_size', { size: MAX_UPLOAD_SIZE_MB }));
        setIsSubmitting(false);
        return;
      }
      const file = new File([blob], tempFileName || "avatar.jpg", {
        type: blob.type,
      });
      const res = await uploadAdminAvatar(user.id, file);
      const { setUser } = useAuthStore.getState();
      const current = useAuthStore.getState().user;
      setUser({ ...current, avatar_url: res.avatar_url });
      setFormData((prev) => ({
        ...prev,
        avatarPreview: `${process.env.NEXT_PUBLIC_API_BASE_URL}${res.avatar_url}?v=${Date.now()}`,
      }));
      setShowCropper(false);
      URL.revokeObjectURL(tempAvatar);
      setTempAvatar(null);
    } catch (error) {
      if (error?.response?.status === 413) {
        toast.error(t('avatar_max_size', { size: MAX_UPLOAD_SIZE_MB }));
      } else {
        toast.error(t('avatar_upload_failed'));
      }
    } finally {
      setIsSubmitting(false);
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


  const validateForm = () => {
    try {
      profileSchema.parse(formData);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = {};
        err.errors.forEach((error) => {
          newErrors[error.path[0]] = t(error.message);
        });
        setErrors(newErrors);
        if (err.errors?.length) {
          toast.error(t(err.errors[0].message));
        }
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      const social_links = Object.entries(formData.socialLinks || {})
        .filter(([, url]) => url.trim() !== "")
        .map(([platform, url]) => ({ platform, url }));

      await updateAdminProfile({
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
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
      });

      setFormData((prev) => ({
        ...prev,
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
      fetchMessages();
      router.push("/dashboard/admin/profile/steps/Verification");
    } catch (err) {
      toast.error(err.message || t('profile_update_failed'));
      console.error("Profile update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!hasHydrated || loadingProfile) {
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
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, avatarPreview: null }))
                    }
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-gray-300">
                  <FaUserCircle size={48} className="text-gray-400" />
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                <div className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2">
                  {isSubmitting ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaUpload />
                  )}
                  {formData.avatarPreview ? t('change_photo') : t('upload_photo')}
                </div>
              </label>
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
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">LinkedIn</label>
                  <input
                    type="text"
                    name="linkedin"
                    value={formData.socialLinks.linkedin || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, linkedin: e.target.value.trim() },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
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
                {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
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
