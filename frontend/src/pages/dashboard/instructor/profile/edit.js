import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { toast } from "react-toastify";
import { z } from "zod";
import {
  FaAward,
  FaCamera,
  FaCheck,
  FaLink,
  FaPlus,
  FaSpinner,
  FaTrash,
  FaUpload,
  FaVideo,
} from "react-icons/fa";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import {
  getInstructorProfile,
  updateInstructorProfile,
  uploadInstructorAvatar,
  deleteInstructorAvatar,
  uploadInstructorDemo,
  deleteInstructorDemo,
  uploadCertificateFile,
  deleteCertificateFile,
} from "@/services/instructor/instructorService";
import logger from "@/utils/logger";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const PROFILE_SCHEMA = z.object({
  full_name: z.string().trim().min(3, "Full name must be at least 3 characters"),
  phone: z.string().trim().min(8, "Phone number must be at least 8 digits"),
  gender: z.enum(["male", "female", "other", "prefer-not-to-say"]),
  date_of_birth: z
    .string()
    .trim()
    .refine((val) => !Number.isNaN(new Date(val).getTime()), "Please select a valid date"),
  expertise: z.array(z.string().trim()).min(1, "Add at least one expertise"),
  experience: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), "Experience must be a whole number"),
  bio: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || val.split(/\s+/).filter(Boolean).length <= 150,
      "Bio must be 150 words or fewer"
    ),
  certifications: z.string().trim().optional(),
  pricing: z.string().trim().optional(),
  demo_video_url: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^https?:\/\/.+/i.test(val),
      "Enter a valid URL starting with http or https"
    ),
  socialLinks: z.record(z.string().trim()).optional(),
});

const DEFAULT_SOCIAL_LINKS = {
  linkedin: "",
  website: "",
  youtube: "",
  twitter: "",
  instagram: "",
};

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DEMO_BYTES = 150 * 1024 * 1024; // 150 MB

function InstructorProfileEditPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard", {
    keyPrefix: "instructorProfilePage",
  });
  const { user, hasHydrated, setUser } = useAuthStore();
  const fetchNotifications = useNotificationStore((state) => state.fetch);
  const fetchMessages = useMessageStore((state) => state.fetch);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    expertise: [],
    experience: "",
    bio: "",
    certifications: "",
    pricing: "",
    demo_video_url: "",
    socialLinks: { ...DEFAULT_SOCIAL_LINKS },
  });
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [demoUploading, setDemoUploading] = useState(false);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [certificates, setCertificates] = useState([]);
  const [newCertificateTitle, setNewCertificateTitle] = useState("");
  const certificateInputRef = useRef(null);
  const [expanded, setExpanded] = useState({
    personal: true,
    professional: true,
    social: true,
    media: true,
    certificates: true,
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      setLoadingProfile(false);
      return;
    }

    if (user.role?.toLowerCase() !== "instructor") {
      router.replace("/dashboard");
      return;
    }

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const profile = await getInstructorProfile();
        const defaultSocial = { ...DEFAULT_SOCIAL_LINKS };
        profile.social_links?.forEach((link) => {
          if (link.platform) {
            defaultSocial[link.platform] = link.url || "";
          }
        });

        setFormData({
          full_name: profile.full_name || "",
          phone: profile.phone || "",
          gender: profile.gender || "male",
          date_of_birth: profile.date_of_birth
            ? profile.date_of_birth.split("T")[0]
            : "",
          expertise: profile.instructor?.expertise || [],
          experience:
            typeof profile.instructor?.experience === "number"
              ? String(profile.instructor.experience || "")
              : profile.instructor?.experience
              ? String(profile.instructor.experience)
              : "",
          bio: profile.instructor?.bio || "",
          certifications: profile.instructor?.certifications || "",
          pricing: profile.instructor?.pricing || "",
          demo_video_url: profile.instructor?.demo_video_url || "",
          socialLinks: defaultSocial,
        });
        setEmail(profile.email || "");
        setAvatarUrl(profile.avatar_url || null);
        setCertificates(Array.isArray(profile.certificates) ? profile.certificates : []);
      } catch (err) {
        toast.error(t("loadError", "Failed to load profile details."));
        logger.error?.("Instructor profile load error", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfile();
  }, [hasHydrated, user, router, t]);

  const socialPlatforms = useMemo(() => {
    const keys = new Set([
      ...Object.keys(DEFAULT_SOCIAL_LINKS),
      ...Object.keys(formData.socialLinks || {}),
    ]);
    return Array.from(keys);
  }, [formData.socialLinks]);

  const toggleSection = (section) => {
    setExpanded((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSocialChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  const handleExpertiseKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addExpertiseTag();
    }
  };

  const addExpertiseTag = () => {
    const value = expertiseInput.trim();
    if (!value) return;
    setFormData((prev) => {
      if (prev.expertise.some((item) => item.toLowerCase() === value.toLowerCase())) {
        return prev;
      }
      return { ...prev, expertise: [...prev.expertise, value] };
    });
    setExpertiseInput("");
    if (errors.expertise) {
      setErrors((prev) => ({ ...prev, expertise: null }));
    }
  };

  const removeExpertiseTag = (skill) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter(
        (item) => item.toLowerCase() !== skill.toLowerCase()
      ),
    }));
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("avatarTooLarge", "Avatar must be smaller than 5MB."));
      return;
    }
    setAvatarUploading(true);
    try {
      const res = await uploadInstructorAvatar(user.id, file);
      const url = res?.avatar_url || null;
      setAvatarUrl(url);
      setUser({
        ...user,
        avatar_url: url,
        profile_complete: true,
      });
      if (url) {
        toast.success(t("avatarUpdated", "Avatar updated successfully."));
      } else {
        toast.success(t("avatarRemoved", "Avatar removed."));
      }
    } catch (err) {
      toast.error(t("avatarUploadFailed", "Failed to upload avatar."));
      logger.error?.("Avatar upload failed", err);
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setAvatarUploading(true);
    try {
      await deleteInstructorAvatar(user.id);
      setAvatarUrl(null);
      setUser({
        ...user,
        avatar_url: null,
      });
      toast.success(t("avatarRemoved", "Avatar removed."));
    } catch (err) {
      toast.error(t("avatarRemoveFailed", "Failed to remove avatar."));
      logger.error?.("Avatar removal failed", err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDemoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (file.size > MAX_DEMO_BYTES) {
      toast.error(t("demoTooLarge", "Demo video must be smaller than 150MB."));
      return;
    }
    setDemoUploading(true);
    try {
      const res = await uploadInstructorDemo(file, user.id);
      const demoUrl = res?.demo_video_url || "";
      setFormData((prev) => ({
        ...prev,
        demo_video_url: demoUrl,
      }));
      toast.success(t("demoUpdated", "Demo video uploaded successfully."));
    } catch (err) {
      toast.error(t("demoUploadFailed", "Failed to upload demo video."));
      logger.error?.("Demo upload failed", err);
    } finally {
      setDemoUploading(false);
      event.target.value = "";
    }
  };

  const handleDemoDelete = async () => {
    if (!user) return;
    setDemoUploading(true);
    try {
      await deleteInstructorDemo(user.id);
      setFormData((prev) => ({
        ...prev,
        demo_video_url: "",
      }));
      toast.success(t("demoRemoved", "Demo video removed."));
    } catch (err) {
      toast.error(t("demoRemoveFailed", "Failed to remove demo video."));
      logger.error?.("Demo removal failed", err);
    } finally {
      setDemoUploading(false);
    }
  };

  const handleCertificateUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!newCertificateTitle.trim()) {
      toast.error(t("certificateTitleRequired", "Please provide a title first."));
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("certificateTooLarge", "Certificate must be smaller than 10MB."));
      event.target.value = "";
      return;
    }
    setCertificateUploading(true);
    try {
      const form = new FormData();
      form.append("title", newCertificateTitle.trim());
      form.append("file", file);
      const res = await uploadCertificateFile(form);
      if (res) {
        setCertificates((prev) => [res, ...prev]);
        setNewCertificateTitle("");
        if (certificateInputRef.current) {
          certificateInputRef.current.value = "";
        }
        toast.success(t("certificateUploaded", "Certificate added."));
      }
    } catch (err) {
      toast.error(t("certificateUploadFailed", "Failed to upload certificate."));
      logger.error?.("Certificate upload failed", err);
    } finally {
      setCertificateUploading(false);
      event.target.value = "";
    }
  };

  const handleCertificateDelete = async (certificateId) => {
    if (!certificateId) return;
    setCertificateUploading(true);
    try {
      await deleteCertificateFile(certificateId);
      setCertificates((prev) => prev.filter((cert) => cert.id !== certificateId));
      toast.success(t("certificateDeleted", "Certificate removed."));
    } catch (err) {
      toast.error(t("certificateDeleteFailed", "Failed to delete certificate."));
      logger.error?.("Certificate delete failed", err);
    } finally {
      setCertificateUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrors({});
    try {
      const parsed = PROFILE_SCHEMA.parse({
        ...formData,
        socialLinks: formData.socialLinks,
      });
      const payload = {
        full_name: parsed.full_name.trim(),
        phone: parsed.phone.trim(),
        gender: parsed.gender,
        date_of_birth: parsed.date_of_birth,
        expertise: parsed.expertise,
        experience: parsed.experience ? Number(parsed.experience) : null,
        bio: parsed.bio || null,
        certifications: parsed.certifications || null,
        pricing: parsed.pricing || null,
        demo_video_url: parsed.demo_video_url || null,
        social_links: Object.entries(parsed.socialLinks || {})
          .filter(([, value]) => value && value.trim().length > 0)
          .map(([platform, url]) => ({
            platform,
            url: url.trim(),
          })),
      };
      setIsSubmitting(true);
      const updated = await updateInstructorProfile(payload);
      const defaultSocial = { ...DEFAULT_SOCIAL_LINKS };
      updated.social_links?.forEach((link) => {
        if (link.platform) {
          defaultSocial[link.platform] = link.url || "";
        }
      });
      setFormData({
        full_name: updated.full_name || "",
        phone: updated.phone || "",
        gender: updated.gender || "male",
        date_of_birth: updated.date_of_birth
          ? updated.date_of_birth.split("T")[0]
          : "",
        expertise: updated.instructor?.expertise || [],
        experience:
          typeof updated.instructor?.experience === "number"
            ? String(updated.instructor.experience || "")
            : updated.instructor?.experience
            ? String(updated.instructor.experience)
            : "",
        bio: updated.instructor?.bio || "",
        certifications: updated.instructor?.certifications || "",
        pricing: updated.instructor?.pricing || "",
        demo_video_url: updated.instructor?.demo_video_url || "",
        socialLinks: defaultSocial,
      });
      setCertificates(Array.isArray(updated.certificates) ? updated.certificates : []);
      setEmail(updated.email || email);
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        setUser({
          ...currentUser,
          full_name: updated.full_name || currentUser.full_name,
          phone: updated.phone || currentUser.phone,
          gender: updated.gender || currentUser.gender,
          date_of_birth: updated.date_of_birth || currentUser.date_of_birth,
          profile_complete: true,
        });
      }
      fetchNotifications?.();
      fetchMessages?.();
      toast.success(t("profileSaved", "Profile updated successfully."));
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = err.flatten().fieldErrors;
        const mapped = Object.keys(fieldErrors).reduce((acc, key) => {
          if (fieldErrors[key]?.length) {
            acc[key] = fieldErrors[key][0];
          }
          return acc;
        }, {});
        setErrors(mapped);
      } else if (err?.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error(t("profileSaveFailed", "Failed to update profile."));
        logger.error?.("Instructor profile update failed", err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasHydrated || !user || loadingProfile) {
    return (
      <InstructorLayout>
        <div className="flex items-center justify-center py-24">
          <FaSpinner className="mr-3 h-5 w-5 animate-spin text-emerald-500" />
          <span>{t("loading", "Loading profile...")}</span>
        </div>
      </InstructorLayout>
    );
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  const avatarPreview = avatarUrl ? `${apiBase}${avatarUrl}` : null;
  const isEmailVerified = Boolean(user?.is_email_verified);

  return (
    <InstructorLayout>
      <div className="px-6 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {!isEmailVerified && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-6 py-4 text-yellow-900">
              <div className="flex items-center gap-3">
                <FaCheck className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-semibold">
                    {t("verifyHeading", "Verify your email to unlock payouts.")}
                  </p>
                  <p className="text-sm">
                    {t(
                      "verifyCopy",
                      "We sent a verification link to your inbox. Complete this step to access all instructor tools."
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/auth/verify-email")}
                  className="ml-auto rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-yellow-900 transition hover:bg-yellow-400"
                >
                  {t("verifyCta", "Verify now")}
                </button>
              </div>
            </div>
          )}

          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="relative h-32 w-32 flex-shrink-0">
                <div className="h-full w-full overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt={t("avatarAlt", "Instructor avatar")}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-gray-400">
                      {formData.full_name?.charAt(0)?.toUpperCase() || "I"}
                    </div>
                  )}
                </div>
                <label className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-lg transition hover:bg-emerald-500">
                  <FaCamera className="h-4 w-4" />
                  <span>{avatarUploading ? t("uploading", "Uploading...") : t("change", "Change")}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-gray-100"
                    disabled={avatarUploading}
                  >
                    {avatarUploading
                      ? t("removing", "Removing...")
                      : t("removeAvatar", "Remove")}
                  </button>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {t("pageTitle", "Instructor profile")}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {t(
                    "pageSubtitle",
                    "Tell learners about your expertise, highlight your achievements, and keep your contact details accurate."
                  )}
                </p>
                <div className="mt-4 flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:items-center md:gap-4">
                  <span className="font-medium">{email}</span>
                  <span className="flex items-center gap-2">
                    <FaCheck
                      className={`h-3 w-3 ${
                        isEmailVerified ? "text-emerald-500" : "text-gray-400"
                      }`}
                    />
                    {isEmailVerified
                      ? t("emailVerified", "Email verified")
                      : t("emailPending", "Email verification pending")}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl bg-white shadow-sm">
              <header
                onClick={() => toggleSection("personal")}
                className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-6 py-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("personalInfo", "Personal information")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t(
                      "personalInfoCopy",
                      "These details help us keep your account secure."
                    )}
                  </p>
                </div>
                <FaPlus
                  className={`h-4 w-4 text-gray-400 transition ${
                    expanded.personal ? "rotate-45" : ""
                  }`}
                />
              </header>
              {expanded.personal && (
                <div className="grid gap-6 px-6 pb-6 pt-2 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("fullName", "Full name")}
                    </label>
                    <input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder={t("fullNamePlaceholder", "Jane Doe")}
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("phone", "Phone number")}
                    </label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      placeholder={t("phonePlaceholder", "+1 555 123 4567")}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("gender", "Gender")}
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="male">{t("male", "Male")}</option>
                      <option value="female">{t("female", "Female")}</option>
                      <option value="other">{t("other", "Other")}</option>
                      <option value="prefer-not-to-say">
                        {t("preferNotToSay", "Prefer not to say")}
                      </option>
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-xs text-red-500">{errors.gender}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("dob", "Date of birth")}
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {errors.date_of_birth && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.date_of_birth}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white shadow-sm">
              <header
                onClick={() => toggleSection("professional")}
                className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-6 py-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("professionalProfile", "Professional profile")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t(
                      "professionalCopy",
                      "Share your teaching background and core strengths."
                    )}
                  </p>
                </div>
                <FaPlus
                  className={`h-4 w-4 text-gray-400 transition ${
                    expanded.professional ? "rotate-45" : ""
                  }`}
                />
              </header>
              {expanded.professional && (
                <div className="grid gap-6 px-6 pb-6 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("expertise", "Areas of expertise")}
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.expertise.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeExpertiseTag(skill)}
                            className="text-xs text-emerald-500 hover:text-emerald-700"
                            aria-label={t("removeSkill", "Remove skill")}
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                      <label className="flex flex-1 items-center rounded-lg border border-dashed border-gray-300 px-2">
                        <input
                          type="text"
                          value={expertiseInput}
                          onChange={(e) => setExpertiseInput(e.target.value)}
                          onKeyDown={handleExpertiseKeyDown}
                          placeholder={t("expertisePlaceholder", "Press Enter to add")}
                          className="w-full border-none bg-transparent py-2 text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={addExpertiseTag}
                          className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-200"
                        >
                          {t("add", "Add")}
                        </button>
                      </label>
                    </div>
                    {errors.expertise && (
                      <p className="mt-1 text-xs text-red-500">{errors.expertise}</p>
                    )}
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t("experienceYears", "Teaching experience (years)")}
                      </label>
                      <input
                        name="experience"
                        type="number"
                        min="0"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      {errors.experience && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.experience}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t("pricing", "Pricing notes")}
                      </label>
                      <input
                        name="pricing"
                        value={formData.pricing}
                        onChange={handleInputChange}
                        placeholder={t("pricingPlaceholder", "e.g. $30/hour or custom")}
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      {errors.pricing && (
                        <p className="mt-1 text-xs text-red-500">{errors.pricing}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("bio", "Professional bio")}
                    </label>
                    <textarea
                      name="bio"
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder={t(
                        "bioPlaceholder",
                        "Share your teaching style, achievements, and what learners can expect."
                      )}
                      className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {errors.bio && (
                      <p className="mt-1 text-xs text-red-500">{errors.bio}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("certifications", "Certification highlights")}
                    </label>
                    <textarea
                      name="certifications"
                      rows={3}
                      value={formData.certifications}
                      onChange={handleInputChange}
                      placeholder={t(
                        "certificationsPlaceholder",
                        "Highlight certifications or accreditations learners should know about."
                      )}
                      className="mt-2 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {errors.certifications && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.certifications}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white shadow-sm">
              <header
                onClick={() => toggleSection("social")}
                className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-6 py-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("socialPresence", "Social presence")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t(
                      "socialCopy",
                      "Add links learners can use to explore your work."
                    )}
                  </p>
                </div>
                <FaPlus
                  className={`h-4 w-4 text-gray-400 transition ${
                    expanded.social ? "rotate-45" : ""
                  }`}
                />
              </header>
              {expanded.social && (
                <div className="grid gap-6 px-6 pb-6 pt-2">
                  {socialPlatforms.map((platform) => (
                    <div key={platform}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-2 capitalize">
                          <FaLink className="h-3 w-3 text-gray-400" />
                          {platform.replace(/[-_]/g, " ")}
                        </span>
                      </label>
                      <input
                        value={formData.socialLinks?.[platform] || ""}
                        onChange={(e) =>
                          handleSocialChange(platform, e.target.value)
                        }
                        placeholder="https://"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white shadow-sm">
              <header
                onClick={() => toggleSection("media")}
                className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-6 py-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("mediaShowcase", "Media & demo")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t(
                      "mediaCopy",
                      "Add a demo video link or upload a short introduction clip."
                    )}
                  </p>
                </div>
                <FaPlus
                  className={`h-4 w-4 text-gray-400 transition ${
                    expanded.media ? "rotate-45" : ""
                  }`}
                />
              </header>
              {expanded.media && (
                <div className="grid gap-6 px-6 pb-6 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t("demoVideoUrl", "Demo video URL")}
                    </label>
                    <input
                      name="demo_video_url"
                      value={formData.demo_video_url}
                      onChange={handleInputChange}
                      placeholder="https://"
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {errors.demo_video_url && (
                      <p className="mt-1 text-xs text-red-500">
                        {errors.demo_video_url}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700">
                          {t("demoUpload", "Upload an introduction clip")}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {t(
                            "demoUploadCopy",
                            "MP4, MOV, or WEBM up to 150MB. Ideal length: 1-2 minutes."
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                          <FaUpload className="h-4 w-4" />
                          {demoUploading
                            ? t("uploading", "Uploading...")
                            : t("upload", "Upload")}
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            className="hidden"
                            onChange={handleDemoUpload}
                          />
                        </label>
                        {formData.demo_video_url && (
                          <button
                            type="button"
                            onClick={handleDemoDelete}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                            disabled={demoUploading}
                          >
                            {demoUploading
                              ? t("removing", "Removing...")
                              : t("remove", "Remove")}
                          </button>
                        )}
                      </div>
                    </div>
                    {formData.demo_video_url && (
                      <div className="mt-4 flex items-center gap-3 text-sm text-emerald-600">
                        <FaVideo className="h-4 w-4" />
                        <span className="truncate">
                          {formData.demo_video_url.replace(apiBase, "")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white shadow-sm">
              <header
                onClick={() => toggleSection("certificates")}
                className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-6 py-4"
              >
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("certificatesHeading", "Certificates")}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {t(
                      "certificatesCopy",
                      "Upload supporting documents to build learner confidence."
                    )}
                  </p>
                </div>
                <FaPlus
                  className={`h-4 w-4 text-gray-400 transition ${
                    expanded.certificates ? "rotate-45" : ""
                  }`}
                />
              </header>
              {expanded.certificates && (
                <div className="px-6 pb-6 pt-2">
                  <div className="flex flex-col gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {t("certificateTitle", "Certificate title")}
                      </label>
                      <input
                        value={newCertificateTitle}
                        onChange={(e) => setNewCertificateTitle(e.target.value)}
                        placeholder={t("certificateTitlePlaceholder", "e.g. TESOL 2023")}
                        className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
                      <FaAward className="h-4 w-4" />
                      {certificateUploading
                        ? t("uploading", "Uploading...")
                        : t("uploadCertificate", "Upload certificate")}
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        className="hidden"
                        onChange={handleCertificateUpload}
                        ref={certificateInputRef}
                      />
                    </label>
                  </div>
                  <div className="mt-4 space-y-3">
                    {certificates.length === 0 && (
                      <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        {t("noCertificates", "No certificates uploaded yet.")}
                      </p>
                    )}
                    {certificates.map((certificate) => (
                      <div
                        key={certificate.id}
                        className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 shadow-sm"
                      >
                        <div className="max-w-md">
                          <p className="font-semibold text-gray-800">
                            {certificate.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(certificate.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={`${apiBase}${certificate.file_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                          >
                            {t("view", "View")}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCertificateDelete(certificate.id)}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                            disabled={certificateUploading}
                          >
                            <FaTrash className="h-3 w-3" />
                            {t("delete", "Delete")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && (
                  <FaSpinner className="h-4 w-4 animate-spin text-white" />
                )}
                {isSubmitting
                  ? t("saving", "Saving changes...")
                  : t("saveChanges", "Save changes")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </InstructorLayout>
  );
}

const ProtectedPage = withAuthProtection(InstructorProfileEditPage, ["instructor"]);
export default ProtectedPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
