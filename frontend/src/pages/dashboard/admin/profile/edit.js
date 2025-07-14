// Reusable Admin Profile Edit Template (Tailwind + API + Zod + Crop + Upload + Modal)
// This is based on the polished UI you implemented — to be used for other roles/forms

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { z } from "zod";
import AdminLayout from "@/components/layouts/AdminLayout";
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
import {
  getAdminProfile,
  updateAdminProfile,
  uploadAdminAvatar,
} from "@/services/admin/adminService";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";

// Add service imports as needed, e.g., getProfile, updateProfile, uploadAvatar, etc.

const profileSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone must be at least 8 digits"),
  job_title: z.string().min(2),
  department: z.string().min(2),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" }),
  socialLinks: z.record(z.string().url("Must be a valid URL")).optional(),
});

export default function ProfileEditTemplate() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
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

  useEffect(() => {

    if (!hasHydrated) return;
    if (!user || user.role?.toLowerCase() !== "admin") {
      setLoadingProfile(false);
      return;
    }

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
        toast.error("Failed to load profile");
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
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max size 2MB");
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
      const croppedUrl = await getCroppedImg(tempAvatar, croppedAreaPixels);
      const blob = await fetch(croppedUrl).then((r) => r.blob());
      const file = new File([blob], tempFileName || "avatar.jpg", {
        type: blob.type,
      });
      const res = await uploadAdminAvatar(user.id, file);
      const setUser = useAuthStore.getState().setUser;
      setUser((prev) => ({ ...prev, avatar_url: res.avatar_url }));
      setFormData((prev) => ({
        ...prev,
        avatarPreview: `${process.env.NEXT_PUBLIC_API_BASE_URL}${res.avatar_url}?v=${Date.now()}`,
      }));
      setShowCropper(false);
      URL.revokeObjectURL(tempAvatar);
      setTempAvatar(null);
    } catch (error) {
      toast.error("Failed to upload avatar");
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
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = {};
        err.errors.forEach((error) => {
          newErrors[error.path[0]] = error.message;
        });
        setErrors(newErrors);
        if (err.errors[0]) toast.error(err.errors[0].message);
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
      const setUser = useAuthStore.getState().setUser;
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

      toast.success("Profile updated successfully!");
      await fetchNotifications();
      router.push("/dashboard/admin");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
      console.error("Profile update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (!hasHydrated || loadingProfile) {

    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-4xl text-yellow-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Edit</h1>
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaUserCircle className="text-yellow-600" /> Profile Picture
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
                  {formData.avatarPreview ? "Change Photo" : "Upload Photo"}
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
              <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
              {expanded.personal ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            {expanded.personal && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.full_name ? "border-red-500" : "border-gray-300"} rounded-md`}
                  />
                  {errors.full_name && <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
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
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border ${errors.phone ? "border-red-500" : "border-gray-300"} rounded-md`}
                  />
                  {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                </div>
                {/* Gender and DOB */}
                <div>
                  <label className="block text-sm font-medium mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth *</label>
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
              <h2 className="text-lg font-semibold text-gray-800">Social Links</h2>
              {expanded.social ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            {expanded.social && (
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">LinkedIn</label>
                  <input
                    type="url"
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
                  <FaSpinner className="animate-spin mr-2" /> Saving...
                </span>
              ) : (
                'Save Changes'
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
                Cancel
              </button>
              <button
                onClick={handleCropUpload}
                className="px-4 py-2 bg-yellow-600 text-white rounded flex items-center gap-2"
              >
                {isSubmitting ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
