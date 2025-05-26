// ✅ Premium Admin Profile Edit UI with Full API Integration
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { z } from "zod";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  uploadAdminAvatar,
  uploadAdminIdentity,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword
} from "@/services/admin/adminService";
import useAuthStore from "@/store/auth/authStore";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import {
  FaUpload, FaTrash, FaFilePdf, FaCheck,
  FaTimesCircle, FaChevronDown, FaChevronUp,
  FaLinkedin, FaGithub, FaUserTie, FaIdCard,
  FaUserCircle, FaLock, FaSpinner
} from "react-icons/fa";

const adminProfileSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  avatar_url: z.any().optional(),
  job_title: z.string().min(2, "Job title is required"),
  department: z.string().min(2, "Department is required"),
  socialLinks: z.record(z.string().url("Must be a valid URL")).optional(),
});

export default function AdminProfileEdit() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    avatar_url: null,
    avatarPreview: null,
    job_title: "",
    department: "",
    identityFile: null,
    identityPreview: null,
    socialLinks: {}
  });

  const [errors, setErrors] = useState({});
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [expanded, setExpanded] = useState({
    avatar: true,
    personal: true,
    identity: true,
    social: true
  });


  useEffect(() => {
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const role = user.role?.toLowerCase();
    if (role !== "admin" && role !== "superadmin") {
      toast.error("Unauthorized access");
      router.replace("/");
    }
  }, [user]);


  // Fetch admin profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getAdminProfile();
        const {
          full_name,
          phone,
          gender,
          date_of_birth,
          avatar_url,
          job_title,
          department,
          social_links
        } = response;

        // Convert social_links array to object
        const socialLinks = {};
        social_links?.forEach(link => {
          socialLinks[link.platform] = link.url;
        });

        setFormData({
          full_name,
          phone,
          gender: gender || "male",
          date_of_birth: date_of_birth?.split('T')[0] || "",
          avatar_url,
          avatarPreview: avatar_url,
          job_title,
          department,
          identityFile: null,
          identityPreview: null,
          socialLinks
        });
      } catch (error) {
        toast.error("Failed to load profile data");
        console.error("Profile fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleSection = (section) => setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  const onCropComplete = useCallback((_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels), []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    try {
      const res = await uploadAdminAvatar(user.id, file); // ✅ Just send File
      const data = await res;

      // ✅ Update auth store so Navbar/avatar reflects change
      useAuthStore.getState().setUser({
        ...user,
        avatar_url: data.avatar_url,
      });

      setFormData(prev => ({
        ...prev,
        avatar_url: data.avatar_url,
        avatarPreview: `${process.env.NEXT_PUBLIC_API_BASE_URL}${data.avatar_url}`
      }));

      toast.success("Avatar uploaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload avatar.");
    }
  };




  const handleIdentityUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side validation
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("PDF size should be less than 5MB");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await uploadAdminIdentity(file);

      setFormData(prev => ({
        ...prev,
        identityFile: file,
        identityPreview: URL.createObjectURL(file),
        // Update with the server response if needed
      }));

      toast.success("Identity document uploaded successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to upload identity document");
      console.error("Upload error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeIdentity = () => {
    setFormData(prev => ({
      ...prev,
      identityFile: null,
      identityPreview: null
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSocialLinkChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value.trim() }
    }));
  };

  const validateForm = () => {
    try {
      adminProfileSchema.parse({
        full_name: formData.full_name,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        avatar_url: formData.avatar_url,
        job_title: formData.job_title,
        department: formData.department,
        socialLinks: formData.socialLinks
      });
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = {};
        err.errors.forEach(error => {
          newErrors[error.path[0]] = error.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      // Handle avatar upload if it's a new file
      let avatarUrl = formData.avatar_url;
      if (avatarUrl instanceof File) {
        const form = new FormData();
        form.append("avatar", avatarUrl);
        const res = await uploadAdminAvatar(user.id, form);
        avatarUrl = res.avatar_url;
      }

      if (formData.identityFile) {
        await uploadAdminIdentity(formData.identityFile);
      }


      // Prepare payload according to API structure
      const payload = {
        full_name: formData.full_name,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        avatar_url: avatarUrl,
        job_title: formData.job_title,
        department: formData.department,
        social_links: Object.entries(formData.socialLinks || {}).map(([platform, url]) => ({
          platform,
          url
        }))
      };

      await updateAdminProfile(payload);
      toast.success("Profile updated successfully!");
      router.push("/dashboard/admin");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
      console.error("Profile update error:", err);

      // Handle unauthorized (token expired)
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        logout();
        router.push("/auth/login");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    // Validate password form
    const newErrors = {};
    if (!passwordForm.currentPassword) newErrors.currentPassword = "Current password is required";
    if (!passwordForm.newPassword) newErrors.newPassword = "New password is required";
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setPasswordErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await changeAdminPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
      console.error("Password change error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Admin Profile</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <FaLock className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </div>
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
                  <h2 className="text-lg font-semibold text-gray-800">Profile Picture</h2>
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
                          onClick={() => setFormData(prev => ({ ...prev, avatar_url: null, avatarPreview: null }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <FaTimesCircle className="w-5 h-5" />
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
                        <span>{formData.avatarPreview ? 'Change Photo' : 'Upload Photo'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-2 text-xs text-gray-500">JPG, PNG up to 2MB</p>
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
                  <h2 className="text-lg font-semibold text-gray-800">Identity Verification</h2>
                </div>
                {expanded.identity ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.identity && (
                <div className="p-4 space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {formData.identityPreview ? (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center p-3 bg-purple-100 rounded-full">
                          <FaFilePdf className="w-8 h-8 text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Identity Document Uploaded</p>
                        <div className="flex justify-center space-x-3">
                          <a
                            href={formData.identityPreview}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-yellow-50 text-yellow-600 rounded-md text-sm hover:bg-yellow-100 transition-colors flex items-center space-x-1"
                          >
                            <FaFilePdf className="w-3 h-3" />
                            <span>View PDF</span>
                          </a>
                          <button
                            onClick={removeIdentity}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100 transition-colors flex items-center space-x-1"
                          >
                            <FaTrash className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="inline-flex items-center justify-center p-3 bg-gray-100 rounded-full">
                          <FaUpload className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Upload your ID document</p>
                        <p className="text-xs text-gray-500">PDF format only, max 5MB</p>
                        <label className="cursor-pointer inline-block mt-2">
                          <div className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2">
                            <FaUpload className="w-4 h-4" />
                            <span>Select File</span>
                          </div>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleIdentityUpload}
                            className="hidden"
                          />

                        </label>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload a government-issued ID (Passport, Driver's License, or National ID) for verification.
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
                    <FaUserTie className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
                </div>
                {expanded.personal ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.personal && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={`w-full px-3 py-2 border ${errors.full_name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                      />
                      {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 123-4567"
                        className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                      />
                      {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border ${errors.date_of_birth ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                      />
                      {errors.date_of_birth && <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                      <input
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleChange}
                        placeholder="e.g., System Administrator"
                        className={`w-full px-3 py-2 border ${errors.job_title ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                      />
                      {errors.job_title && <p className="mt-1 text-sm text-red-600">{errors.job_title}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <input
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g., IT Department"
                        className={`w-full px-3 py-2 border ${errors.department ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                      />
                      {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
                    </div>
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
                    <FaLinkedin className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">Social Links</h2>
                </div>
                {expanded.social ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.social && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaLinkedin className="w-4 h-4 mr-2 text-yellow-700" />
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.socialLinks.linkedin || ""}
                      onChange={handleSocialLinkChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <FaGithub className="w-4 h-4 mr-2 text-gray-800" />
                      GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      name="github"
                      value={formData.socialLinks.github || ""}
                      onChange={handleSocialLinkChange}
                      placeholder="https://github.com/yourusername"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => router.push("/dashboard/admin")}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium text-white ${isSubmitting ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 transition-colors'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Change Password</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password *</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className={`w-full px-3 py-2 border ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                  />
                  {passwordErrors.currentPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className={`w-full px-3 py-2 border ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                  />
                  {passwordErrors.newPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className={`w-full px-3 py-2 border ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                  />
                  {passwordErrors.confirmPassword && <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Updating...
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}