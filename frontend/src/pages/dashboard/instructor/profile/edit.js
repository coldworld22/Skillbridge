// ✅ Enhanced Instructor Profile Edit Page
// File: pages/dashboard/instructor/profile/edit.js

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { z } from "zod";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import {
  getInstructorProfile,
  updateInstructorProfile,
  uploadInstructorAvatar,
  uploadInstructorDemo,
  uploadCertificateFile,
  deleteCertificateFile,
} from "@/services/instructor/instructorService";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/utils/cropImage";
import {
  FaUpload, FaTrash, FaSpinner, FaUserCircle, FaVideo,
  FaLinkedin, FaGithub, FaGlobe, FaTwitter, FaYoutube,
  FaFacebook, FaInstagram, FaDollarSign, FaCertificate,
  FaBriefcase, FaCalendarAlt, FaPhone, FaVenusMars, FaUser,
  FaPlus, FaFilePdf, FaFileImage, FaCheck
} from "react-icons/fa";
import { MdOutlineWorkOutline } from "react-icons/md";
import { RiDeleteBin6Line } from "react-icons/ri";

const instructorProfileSchema = z.object({
  full_name: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().min(8, "Phone number must be at least 8 digits"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  experience: z.number().min(0, "Experience must be a positive number"),
  availability: z.boolean().optional(),
  pricing_amount: z.number().min(0, "Amount must be positive").optional(),
  pricing_currency: z.string().optional(),
  expertise: z.array(z.string()).optional(),
  bio: z
    .string()
    .optional()
    .refine((val) => !val || val.split(/\s+/).filter(Boolean).length <= 150, {
      message: "Bio must be 150 words or fewer",
    }),
  socialLinks: z
    .record(z.union([z.literal(""), z.string().url("Must be a valid URL")]))
    .optional(),
});

const socialPlatforms = [
  { name: "linkedin", icon: <FaLinkedin className="text-blue-600" /> },
  { name: "github", icon: <FaGithub className="text-gray-800" /> },
  { name: "twitter", icon: <FaTwitter className="text-blue-400" /> },
  { name: "youtube", icon: <FaYoutube className="text-red-600" /> },
  { name: "facebook", icon: <FaFacebook className="text-blue-700" /> },
  { name: "instagram", icon: <FaInstagram className="text-pink-600" /> },
  { name: "website", icon: <FaGlobe className="text-green-600" /> },
];

const currencyOptions = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
];

export default function InstructorProfileEdit() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();
  const fetchNotifications = useNotificationStore((state) => state.fetch);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    experience: 0,
    availability: false,
    pricing_amount: undefined,
    pricing_currency: "USD",
    expertise: [],
    bio: "",
    socialLinks: {},
    certificates: [],
    avatarPreview: null,
    demoPreview: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newExpertise, setNewExpertise] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newCertificate, setNewCertificate] = useState({
    title: "",
    file: null,
    preview: null,
  });
  const [certificateUploading, setCertificateUploading] = useState(false);

  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [tempFileName, setTempFileName] = useState("");

  useEffect(() => {
    if (!user || user.role?.toLowerCase() !== "instructor") return;

    const loadProfile = async () => {
      try {
        const res = await getInstructorProfile();
        const { full_name, phone, gender, date_of_birth, avatar_url, instructor, social_links, certificates } = res;

        const socialMap = {};
        social_links?.forEach(link => {
          socialMap[link.platform] = link.url;
        });

        // Split pricing if it exists in format "100 USD"
        let pricing_amount;
        let pricing_currency = "USD";
        if (instructor?.pricing) {
          const pricingParts = instructor.pricing.split(" ");
          if (pricingParts.length === 2) {
            const amount = parseFloat(pricingParts[0]);
            pricing_amount = isNaN(amount) ? undefined : amount;
            pricing_currency = pricingParts[1] || "USD";
          }
        }

        const availability = instructor?.availability === "available";

        setFormData(prev => ({
          ...prev,
          full_name,
          phone,
          gender: gender || "male",
          date_of_birth: date_of_birth?.split("T")[0] || "",
          experience: instructor?.experience ? parseInt(instructor.experience) : 0,
          availability,
          pricing_amount,
          pricing_currency,
          expertise: instructor?.expertise || [],
          bio: instructor?.bio || "",
          socialLinks: socialMap,
          certificates: certificates || [],
          avatarPreview: avatar_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${avatar_url}` : null,
          demoPreview: instructor?.demo_video_url ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${instructor.demo_video_url}` : null,
        }));
      } catch (err) {
        toast.error("Failed to load profile");
        console.error("Profile load error:", err);
      }
    };

    loadProfile();
  }, [user]);

  const validateForm = () => {
    try {
      const sanitizedLinks = Object.fromEntries(
        Object.entries(formData.socialLinks).filter(([, url]) => url.trim() !== "")
      );
      instructorProfileSchema.parse({
        ...formData,
        socialLinks: sanitizedLinks,
      });
      setErrors({});
      return true;
    } catch (err) {
      const errs = {};
      err.errors.forEach(e => { errs[e.path[0]] = e.message });
      setErrors(errs);
      if (err.errors?.length) {
        toast.error(err.errors[0].message);
      } else {
        toast.error("Please fix the errors in the form");
      }
      return false;
    }
  };

  const handleCertificateUpload = async () => {
    if (!newCertificate.title || !newCertificate.file) {
      toast.error("Please provide a title and select a file");
      return;
    }

    try {
      setCertificateUploading(true);
      const formData = new FormData();
      formData.append("title", newCertificate.title);
      formData.append("file", newCertificate.file);

      const response = await uploadCertificateFile(formData);

      setFormData(prev => ({
        ...prev,
        certificates: [...prev.certificates, {
          id: response.id,
          title: newCertificate.title,
          file_url: response.file_url
        }]
      }));

      setNewCertificate({ title: "", file: null, preview: null });
      toast.success("Certificate uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload certificate");
      console.error("Certificate upload error:", error);
    } finally {
      setCertificateUploading(false);
    }
  };

  const handleRemoveCertificate = async (certificateId) => {
    try {
      await deleteCertificateFile(certificateId);
      setFormData(prev => ({
        ...prev,
        certificates: prev.certificates.filter(cert => cert.id !== certificateId)
      }));
      toast.success("Certificate removed successfully");
    } catch (error) {
      toast.error("Failed to remove certificate");
      console.error("Certificate removal error:", error);
    }
  };

  const onCropComplete = useCallback((_, area) => {
    setCroppedAreaPixels(area);
  }, []);

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Max size 2MB");
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
      const file = new File([blob], tempFileName || "avatar.jpg", { type: blob.type });
      const res = await uploadInstructorAvatar(user.id, file);
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

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);

      // Combine pricing amount and currency
      const pricing =
        typeof formData.pricing_amount === "number"
          ? `${formData.pricing_amount} ${formData.pricing_currency}`
          : "";

      const social_links = Object.entries(formData.socialLinks || {})
        .filter(([, url]) => url.trim() !== "")
        .map(([platform, url]) => ({ platform, url }));

      await updateInstructorProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        experience: formData.experience,
        bio: formData.bio,
        availability: formData.availability ? "available" : "unavailable",
        pricing,
        expertise: formData.expertise,
        social_links,
      });
      // Fetch the latest profile to ensure data persisted
      const fresh = await getInstructorProfile();

      // Update the auth store with the returned user data
      const update = useAuthStore.getState().setUser;
      update({
        ...user,
        full_name: fresh.full_name,
        phone: fresh.phone,
        gender: fresh.gender,
        date_of_birth: fresh.date_of_birth,
        avatar_url: fresh.avatar_url,
        profile_complete: true,
      });

      // Reflect updates locally
      setFormData((prev) => ({
        ...prev,
        expertise: fresh.instructor?.expertise || [],
        experience: fresh.instructor?.experience || 0,
        bio: fresh.instructor?.bio || "",
        availability: fresh.instructor?.availability === "available",
        pricing_amount: fresh.instructor?.pricing
          ? (() => {
              const amt = parseFloat(fresh.instructor.pricing.split(" ")[0]);
              return isNaN(amt) ? undefined : amt;
            })()
          : undefined,
        pricing_currency: fresh.instructor?.pricing
          ? fresh.instructor.pricing.split(" ")[1]
          : "USD",
        socialLinks: (fresh.social_links || []).reduce((acc, cur) => {
          acc[cur.platform] = cur.url;
          return acc;
        }, {}),
      }));

      toast.success("Profile updated successfully!");
      await fetchNotifications();
      router.push("/dashboard/instructor");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Edit Instructor Profile</h1>
        </div>

        {/* Avatar and Demo Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-md">
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
                    onClick={() => setFormData(prev => ({ ...prev, avatarPreview: null }))}
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

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FaVideo className="text-purple-600" /> Demo Video
            </h2>
            <div className="flex flex-col items-center">
              {formData.demoPreview ? (
                <div className="relative w-full">
                  <video
                    controls
                    src={formData.demoPreview}
                    className="rounded-md w-full max-h-64 border"
                  />
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, demoPreview: null }))}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center rounded-lg mb-4 border-2 border-dashed border-gray-300">
                  <FaVideo className="text-3xl text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Upload a demo video</p>
                </div>
              )}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 50 * 1024 * 1024) return toast.error("Max size 50MB");
                    setIsSubmitting(true);
                    try {
                      const res = await uploadInstructorDemo(user.id, file);
                      setFormData(prev => ({
                        ...prev,
                        demoPreview: `${process.env.NEXT_PUBLIC_API_BASE_URL}${res.demo_video_url}`
                      }));
                    } catch (error) {
                      toast.error("Failed to upload demo video");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="hidden"
                />
                <div className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                  {isSubmitting ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaUpload />
                  )}
                  {formData.demoPreview ? "Change Video" : "Upload Video"}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Personal and Professional Info */}
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaUser className="text-gray-500" /> Full Name *
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
                <FaPhone className="text-gray-500" /> Phone *
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
                <FaVenusMars className="text-gray-500" /> Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaCalendarAlt className="text-gray-500" /> Date of Birth *
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
        <label className="block text-sm font-medium mb-1">Bio (max 150 words)</label>
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
        Professional Information
      </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <MdOutlineWorkOutline className="text-gray-500" /> Years of Experience *
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
                <FaCalendarAlt className="text-gray-500" /> Availability
              </label>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, availability: !prev.availability }))}
                className={`px-4 py-2 rounded-md ${formData.availability ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {formData.availability ? 'Available' : 'Unavailable'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <FaDollarSign className="text-gray-500" /> Pricing (per hour)
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
                  placeholder="Amount (e.g., 100)"
                />
                <select
                  name="pricing_currency"
                  value={formData.pricing_currency}
                  onChange={(e) => setFormData({ ...formData, pricing_currency: e.target.value })}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                >
                  {currencyOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-sm text-gray-500 mt-1">e.g. 100 USD per hour</p>
            </div>
          </div>

          {/* Expertise List */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <FaBriefcase className="text-gray-500" /> Expertise
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.expertise.map((tag, i) => (
                <span key={i} className="inline-flex items-center bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                  {tag}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      expertise: prev.expertise.filter((_, idx) => idx !== i)
                    }))}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    <RiDeleteBin6Line size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newExpertise.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      expertise: [...prev.expertise, newExpertise.trim()],
                    }));
                    setNewExpertise("");
                  }
                }}
                placeholder="Add new expertise (e.g. Yoga, Fitness, Nutrition)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newExpertise.trim()) return;
                  setFormData(prev => ({
                    ...prev,
                    expertise: [...prev.expertise, newExpertise.trim()]
                  }));
                  setNewExpertise("");
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 flex items-center gap-2"
              >
                <FaPlus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Certificates Section */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FaCertificate className="text-gray-500" /> Certificates
            </label>

            {/* Existing Certificates */}
            <div className="space-y-4 mb-6">
              {formData.certificates.map((certificate) => (
                <div key={certificate.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {certificate.file_url.endsWith('.pdf') ? (
                      <FaFilePdf className="text-red-500 text-2xl" />
                    ) : (
                      <FaFileImage className="text-blue-500 text-2xl" />
                    )}
                    <div>
                      <h4 className="font-medium">{certificate.title}</h4>
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_BASE_URL}${certificate.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Certificate
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveCertificate(certificate.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Certificate */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FaPlus className="text-gray-500" /> Add New Certificate
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Certificate Title *</label>
                  <input
                    type="text"
                    value={newCertificate.title}
                    onChange={(e) => setNewCertificate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Yoga Instructor Certification"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Certificate File *</label>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        // Preview for images
                        let preview = null;
                        if (file.type.startsWith('image/')) {
                          preview = URL.createObjectURL(file);
                        }

                        setNewCertificate(prev => ({
                          ...prev,
                          file,
                          preview
                        }));
                      }}
                      className="hidden"
                    />
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-md flex items-center justify-between">
                      <span className="truncate">
                        {newCertificate.file ? newCertificate.file.name : "Choose file (PDF or Image)"}
                      </span>
                      <FaUpload className="text-gray-500" />
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview for image certificates */}
              {newCertificate.preview && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Preview</label>
                  <img
                    src={newCertificate.preview}
                    alt="Certificate preview"
                    className="max-h-40 border rounded-md"
                  />
                </div>
              )}

              <button
                onClick={handleCertificateUpload}
                disabled={!newCertificate.title || !newCertificate.file || certificateUploading}
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {certificateUploading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaUpload />
                )}
                Upload Certificate
              </button>
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-medium mb-2">Social Links</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {socialPlatforms.map((platform) => (
                <div key={platform.name} className="bg-gray-50 p-3 rounded-lg">
                  <label className="text-sm flex items-center gap-2 font-medium mb-1">
                    {platform.icon} {platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}
                  </label>
                  <input
                    type="url"
                    name={platform.name}
                    value={formData.socialLinks[platform.name] || ""}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, [platform.name]: e.target.value },
                    }))}
                    placeholder={`https://${platform.name}.com/yourprofile`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 shadow-md"
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
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
    </InstructorLayout>
  );
}