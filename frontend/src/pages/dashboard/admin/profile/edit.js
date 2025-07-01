// Reusable Admin Profile Edit Template (Tailwind + API + Zod + Crop + Upload + Modal)
// This is based on the polished UI you implemented — to be used for other roles/forms

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { z } from "zod";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSpinner, FaChevronDown, FaChevronUp } from "react-icons/fa";
import useNotificationStore from "@/store/notifications/notificationStore";
import useAuthStore from "@/store/auth/authStore";
import { getAdminProfile, updateAdminProfile } from "@/services/admin/adminService";

// Add service imports as needed, e.g., getProfile, updateProfile, uploadAvatar, etc.

const profileSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
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
  const [formData, setFormData] = useState({
    full_name: "",
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
  const fetchNotifications = useNotificationStore((state) => state.fetch);

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "admin") return;

    const loadProfile = async () => {
      try {
        const res = await getAdminProfile();
        const {
          full_name,
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
      }
    };

    loadProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
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
        phone: fresh.phone,
        gender: fresh.gender,
        date_of_birth: fresh.date_of_birth,
        avatar_url: fresh.avatar_url,
        profile_complete: fresh.profile_complete,
      });

      setFormData((prev) => ({
        ...prev,
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

  if (!hasHydrated) {
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
    </AdminLayout>
  );
}
