import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import StudentLayout from "@/components/layouts/StudentLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import useAuthStore from "@/store/auth/authStore";
import {
  getStudentProfile,
  updateStudentProfile,
} from "@/services/student/studentService";
import { sanitizeRedirectPath } from "@/utils/auth/postLoginRedirect";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const EMPTY_SOCIAL_LINK = { platform: "", url: "" };
const GENDER_OPTIONS = [
  { value: "", label: "Select a gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

function StudentProfileEditPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard", {
    keyPrefix: "studentProfilePage",
  });
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const setUser = useAuthStore((state) => state.setUser);

  const redirectPath = useMemo(() => {
    if (!router.isReady) return null;
    const raw = router.query.redirect ?? router.query.next;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return sanitizeRedirectPath(value);
  }, [router.isReady, router.query.next, router.query.redirect]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    gender: "",
    date_of_birth: "",
    education_level: "",
    learning_goals: "",
  });
  const [topicsInput, setTopicsInput] = useState("");
  const [socialLinks, setSocialLinks] = useState([EMPTY_SOCIAL_LINK]);

  useEffect(() => {
    if (!router.isReady || !hasHydrated) return;
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getStudentProfile();
        setFormData({
          full_name: data.full_name || "",
          phone: data.phone || "",
          gender: data.gender || "",
          date_of_birth: data.date_of_birth
            ? String(data.date_of_birth).slice(0, 10)
            : "",
          education_level: data.student?.education_level || "",
          learning_goals: data.student?.learning_goals || "",
        });
        if (Array.isArray(data.student?.topics)) {
          setTopicsInput(data.student.topics.join(", "));
        } else if (typeof data.student?.topics === "string") {
          setTopicsInput(data.student.topics);
        } else {
          setTopicsInput("");
        }
        setSocialLinks(
          Array.isArray(data.social_links) && data.social_links.length
            ? data.social_links.map((link) => ({
                platform: link.platform || "",
                url: link.url || "",
              }))
            : [EMPTY_SOCIAL_LINK]
        );
      } catch (err) {
        console.error("Failed to load student profile", err);
        toast.error(
          t("loadError", { defaultValue: "Failed to load your profile." })
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router.isReady, hasHydrated, t]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const parsedTopics = useMemo(
    () =>
      topicsInput
        .split(",")
        .map((topic) => topic.trim())
        .filter(Boolean),
    [topicsInput]
  );

  const handleSocialLinkChange = (index, field, value) => {
    setSocialLinks((prev) =>
      prev.map((link, idx) =>
        idx === index ? { ...link, [field]: value } : link
      )
    );
  };

  const addSocialLink = () => {
    setSocialLinks((prev) => [...prev, { ...EMPTY_SOCIAL_LINK }]);
  };

  const removeSocialLink = (index) => {
    setSocialLinks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        education_level: formData.education_level?.trim() || null,
        topics: parsedTopics.length ? parsedTopics.join(", ") : null,
        learning_goals: formData.learning_goals?.trim() || null,
        social_links: socialLinks
          .map((link) => ({
            platform: (link.platform || "").trim(),
            url: (link.url || "").trim(),
          }))
          .filter((link) => link.url),
      };

      await updateStudentProfile(payload);
      toast.success(
        t("saveSuccess", { defaultValue: "Profile updated successfully!" })
      );

      setUser({
        ...(user || {}),
        full_name: payload.full_name || user?.full_name,
        phone: payload.phone || user?.phone,
        gender: payload.gender || user?.gender,
        date_of_birth: payload.date_of_birth || user?.date_of_birth,
        profile_complete: true,
      });

      if (redirectPath) {
        router.replace(redirectPath);
      } else {
        router.replace("/dashboard/student");
      }
    } catch (err) {
      console.error("Failed to save student profile", err);
      toast.error(
        err?.response?.data?.message ||
          t("saveError", { defaultValue: "Failed to save profile." })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentLayout title={t("title", { defaultValue: "Complete your profile" })}>
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-gray-900/60 p-6 text-gray-100 shadow-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white">
              {t("heading", { defaultValue: "Tell us about yourself" })}
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              {t("subheading", {
                defaultValue:
                  "Complete these details so we can personalise your learning experience.",
              })}
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">
              {t("loading", { defaultValue: "Loading profile..." })}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-10">
              <section>
                <h2 className="text-xl font-semibold text-white">
                  {t("basicInfo", { defaultValue: "Basic information" })}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-gray-300">
                      {t("fullName", { defaultValue: "Full name" })} *
                    </span>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-gray-300">
                      {t("phone", { defaultValue: "Phone number" })} *
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-gray-300">
                      {t("gender", { defaultValue: "Gender" })}
                    </span>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="text-gray-300">
                      {t("dob", { defaultValue: "Date of birth" })}
                    </span>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </label>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">
                  {t("learning", { defaultValue: "Learning preferences" })}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm md:col-span-2">
                    <span className="text-gray-300">
                      {t("education", { defaultValue: "Education level" })}
                    </span>
                    <input
                      type="text"
                      name="education_level"
                      value={formData.education_level}
                      onChange={handleInputChange}
                      placeholder={t("educationPlaceholder", {
                        defaultValue: "e.g. Undergraduate, High School, etc.",
                      })}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm md:col-span-2">
                    <span className="text-gray-300">
                      {t("topics", { defaultValue: "Topics you care about" })}
                    </span>
                    <input
                      type="text"
                      value={topicsInput}
                      onChange={(event) => setTopicsInput(event.target.value)}
                      placeholder={t("topicsPlaceholder", {
                        defaultValue: "Separate topics with commas",
                      })}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm md:col-span-2">
                    <span className="text-gray-300">
                      {t("goals", { defaultValue: "Learning goals" })}
                    </span>
                    <textarea
                      name="learning_goals"
                      value={formData.learning_goals}
                      onChange={handleInputChange}
                      rows={4}
                      className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                      placeholder={t("goalsPlaceholder", {
                        defaultValue: "Tell us what success looks like for you.",
                      })}
                    />
                  </label>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white">
                    {t("social", { defaultValue: "Social links" })}
                  </h2>
                  <button
                    type="button"
                    onClick={addSocialLink}
                    className="inline-flex items-center gap-2 rounded-lg border border-yellow-500 px-3 py-1 text-sm font-medium text-yellow-300 transition hover:bg-yellow-500/10"
                  >
                    <FaPlus className="h-3 w-3" />
                    {t("addLink", { defaultValue: "Add link" })}
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  {socialLinks.map((link, index) => (
                    <div
                      key={`social-${index}`}
                      className="flex flex-wrap gap-3 rounded-xl border border-gray-800 bg-gray-900/60 p-4"
                    >
                      <input
                        type="text"
                        value={link.platform}
                        onChange={(event) =>
                          handleSocialLinkChange(
                            index,
                            "platform",
                            event.target.value
                          )
                        }
                        placeholder={t("platformPlaceholder", {
                          defaultValue: "Platform (e.g. LinkedIn)",
                        })}
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(event) =>
                          handleSocialLinkChange(index, "url", event.target.value)
                        }
                        placeholder="https://"
                        className="flex-[2] rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-yellow-500 focus:outline-none"
                      />
                      {socialLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSocialLink(index)}
                          className="inline-flex items-center rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10"
                        >
                          <FaTrash className="mr-2 h-3 w-3" />
                          {t("remove", { defaultValue: "Remove" })}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-3 font-semibold text-gray-900 shadow-lg shadow-yellow-500/40 transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? t("saving", { defaultValue: "Saving..." })
                    : t("cta", { defaultValue: "Save profile" })}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

const ProtectedPage = withAuthProtection(StudentProfileEditPage, ["student"]);
export default ProtectedPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
