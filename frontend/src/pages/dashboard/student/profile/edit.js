import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { z } from "zod";
import StudentLayout from "@/components/layouts/StudentLayout";
import {
  getStudentProfile,
  updateStudentProfile,
  uploadStudentAvatar,
  uploadStudentIdentity
} from "@/services/student/studentService";
import useAuthStore from "@/store/auth/authStore";
import {
  FaUpload, FaTrash, FaFilePdf, FaSpinner,
  FaUserCircle, FaIdCard, FaLinkedin, FaGithub,
  FaChevronDown, FaChevronUp, FaTimesCircle, FaGraduationCap
} from "react-icons/fa";

const studentProfileSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  education_level: z.string().min(2, "Education level is required"),
  topics: z.array(z.string()).optional(),
  learning_goals: z.string().optional(),
  socialLinks: z.record(z.string().url("Must be a valid URL")).optional(),
});

export default function StudentProfileEdit() {
  const router = useRouter();
  const { user, logout, hasHydrated, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  });
  const [errors, setErrors] = useState({});
  useEffect(() => {
  const interval = setInterval(() => {
    console.log("🧪 Zustand hydration debug:");
    console.log("hasHydrated:", useAuthStore.getState().hasHydrated);
    console.log("user:", useAuthStore.getState().user);
  }, 1000);

  return () => clearInterval(interval);
}, []);


  useEffect(() => {
    const local = localStorage.getItem("auth");
    const parsed = JSON.parse(local)?.state;
    if (hasHydrated && !user && parsed?.user) {
      setUser(parsed.user);
    }
  }, [hasHydrated]);

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "student") return;

    const loadProfile = async () => {
      try {
        const res = await getStudentProfile();
        const { full_name, phone, gender, date_of_birth, avatar_url, student, social_links } = res;

        const socialMap = {};
        social_links?.forEach(link => {
          socialMap[link.platform] = link.url;
        });

        setFormData({
          full_name,
          phone,
          gender: gender || "male",
          date_of_birth: date_of_birth?.split("T")[0] || "",
          education_level: student?.education_level || "",
          topics: student?.topics || [],
          learning_goals: student?.learning_goals || "",
          socialLinks: socialMap,
          avatar_url,
          avatarPreview: avatar_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${avatar_url}` : null,
          identityFile: null,
          identityPreview: null,
        });
      } catch (err) {
        toast.error("Failed to load profile data");
        console.error("Profile load error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

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
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await uploadStudentAvatar(user.id, file);
      const avatar_url = res.avatar_url;
      useAuthStore.getState().setUser({ ...user, avatar_url });
      setFormData(prev => ({
        ...prev,
        avatar_url,
        avatarPreview: `${process.env.NEXT_PUBLIC_API_BASE_URL}${avatar_url}`
      }));
      toast.success("Avatar uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload avatar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdentityUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
      await uploadStudentIdentity(user.id, file);
      setFormData(prev => ({
        ...prev,
        identityFile: file,
        identityPreview: URL.createObjectURL(file)
      }));
      toast.success("Identity document uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload identity document");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeIdentity = () => {
    setFormData(prev => ({ ...prev, identityFile: null, identityPreview: null }));
  };

  const validateForm = () => {
    try {
      studentProfileSchema.parse({ ...formData, socialLinks: formData.socialLinks });
      return true;
    } catch (err) {
      const errs = {};
      err.errors.forEach(e => {
        errs[e.path[0]] = e.message;
      });
      setErrors(errs);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      await updateStudentProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        education_level: formData.education_level,
        topics: formData.topics,
        learning_goals: formData.learning_goals,
        social_links: Object.entries(formData.socialLinks || {}).map(([platform, url]) => ({ platform, url }))
      });
      toast.success("Profile updated successfully!");
      router.push("/dashboard/student");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Student Profile</h1>
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
                  <h2 className="text-lg font-semibold text-gray-800">Student ID</h2>
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
                        <p className="text-sm font-medium text-gray-700">ID Document Uploaded</p>
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
                        <p className="text-sm font-medium text-gray-700">Upload your student ID</p>
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
                    Upload your student ID or other verification document.
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                        onChange={handleInputChange}
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
                  <h2 className="text-lg font-semibold text-gray-800">Education Information</h2>
                </div>
                {expanded.education ? <FaChevronUp className="text-gray-500" /> : <FaChevronDown className="text-gray-500" />}
              </div>

              {expanded.education && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education Level *</label>
                    <input
                      name="education_level"
                      value={formData.education_level}
                      onChange={handleInputChange}
                      placeholder="e.g., High School, Bachelor's Degree"
                      className={`w-full px-3 py-2 border ${errors.education_level ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500`}
                    />
                    {errors.education_level && <p className="mt-1 text-sm text-red-600">{errors.education_level}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Learning Goals</label>
                    <textarea
                      name="learning_goals"
                      value={formData.learning_goals}
                      onChange={handleInputChange}
                      placeholder="Describe your learning objectives..."
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
                      <FaLinkedin className="w-4 h-4 mr-2 text-blue-700" />
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.socialLinks.linkedin || ""}
                      onChange={handleSocialChange}
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
                      onChange={handleSocialChange}
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
                onClick={() => router.push("/dashboard/student")}
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
    </StudentLayout>
  );
}