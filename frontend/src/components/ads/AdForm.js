import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { FaSpinner, FaTrash, FaImage, FaVideo } from "react-icons/fa";
import useAdMedia, {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
} from "@/hooks/useAdMedia";

/**
 * Shared form for creating and editing ads. Handles field state, basic
 * validation and media uploads. Consumers should provide an `onSubmit`
 * callback which receives a populated `FormData` instance.
 */
export default function AdForm({
  initialData = {},
  onSubmit,
  allowBrandingEnabled = false,
  checkTitle,
  submitLabel = "Submit",
  tPrefix,
  hideSchedule = false,
  maxDurationDays = null,
  requireTargetRoles = true,
}) {
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: tPrefix });
  const { t: tp } = useTranslation("dashboard", { keyPrefix: "adsPage" });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    startAt: "",
    endAt: "",
    targetRoles: [],
    adType: "promotion",
    priority: 0,
    link: "",
    allowBranding: false,
    ...initialData,
  });

  useEffect(() => {
    setFormData((prev) => ({ ...prev, ...initialData }));
  }, [initialData]);

  useEffect(() => {
    if (!allowBrandingEnabled) {
      setFormData((prev) =>
        prev.allowBranding ? { ...prev, allowBranding: false } : prev
      );
    }
  }, [allowBrandingEnabled]);

  const [error, setError] = useState(null);
  const [titleError, setTitleError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingTitle, setIsCheckingTitle] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    mediaType,
    handleMediaTypeChange,
    handleImageChange,
    handleVideoChange,
    removeMedia,
    videoFile,
    videoPreview,
    imagePreview,
    setMediaType,
  } = useAdMedia({ setFormData, t, setError });

  // Title uniqueness check when provided
  useEffect(() => {
    if (!checkTitle || !formData.title) {
      setTitleError(null);
      return;
    }
    setIsCheckingTitle(true);
    const timeout = setTimeout(async () => {
      try {
        const exists = await checkTitle(formData.title);
        setTitleError(exists ? t("title_exists") : null);
      } catch {
        /* ignore */
      } finally {
        setIsCheckingTitle(false);
      }
    }, 500);
    return () => {
      clearTimeout(timeout);
      setIsCheckingTitle(false);
    };
  }, [formData.title, checkTitle, t]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setError(null);
    if (name === "targetRoles") {
      const role = value;
      setFormData((prev) => ({
        ...prev,
        targetRoles: checked
          ? [...prev.targetRoles, role]
          : prev.targetRoles.filter((r) => r !== role),
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "priority") {
      setFormData((prev) => ({
        ...prev,
        priority: Math.max(0, Number(value)),
      }));
    } else {
      setFormData((prev) => {
        if (
          maxDurationDays !== null &&
          name === "endAt" &&
          value &&
          prev.startAt
        ) {
          const startTime = new Date(prev.startAt);
          const selectedEnd = new Date(value);
          const maxEnd = new Date(
            startTime.getTime() + maxDurationDays * 24 * 60 * 60 * 1000
          );
          if (
            !Number.isNaN(selectedEnd.getTime()) &&
            !Number.isNaN(startTime.getTime()) &&
            selectedEnd > maxEnd
          ) {
            setError(t("duration_exceeded", { days: maxDurationDays }));
            return prev;
          }
        }

        const next = { ...prev, [name]: value };

        if (
          maxDurationDays !== null &&
          name === "startAt" &&
          value &&
          prev.endAt
        ) {
          const startTime = new Date(value);
          const currentEnd = new Date(prev.endAt);
          if (
            !Number.isNaN(startTime.getTime()) &&
            !Number.isNaN(currentEnd.getTime())
          ) {
            const maxEnd = new Date(
              startTime.getTime() + maxDurationDays * 24 * 60 * 60 * 1000
            );
            if (currentEnd > maxEnd) {
              next.endAt = maxEnd.toISOString().split("T")[0];
            }
          }
        }

        return next;
      });
    }
  };

  // Only require a start date; leaving end date blank creates a continuous ad
  const isScheduleValid = hideSchedule || Boolean(formData.startAt);

  const hasTargetRoles =
    !requireTargetRoles || formData.targetRoles.length > 0;

  const isFormValid =
    formData.title &&
    hasTargetRoles &&
    isScheduleValid &&
    ((mediaType === "image" && (formData.image || initialData.image)) ||
      (mediaType === "video" && (videoFile || initialData.video)));

  const disableSubmit =
    !isFormValid || isSubmitting || isCheckingTitle || titleError;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setUploadProgress(0);

    if (!isFormValid) {
      if (requireTargetRoles && formData.targetRoles.length === 0) {
        setError(t("target_audience_required"));
      } else {
        setError(t("title_image_required"));
      }
      return;
    }

    if (
      !hideSchedule &&
      formData.startAt &&
      formData.endAt &&
      new Date(formData.endAt) < new Date(formData.startAt)
    ) {
      setError(t("end_before_start"));
      return;
    }

    if (
      !hideSchedule &&
      maxDurationDays !== null &&
      formData.startAt &&
      formData.endAt
    ) {
      const start = new Date(formData.startAt);
      const end = new Date(formData.endAt);
      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime())
      ) {
        const diffDays = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays > maxDurationDays) {
          setError(t("duration_exceeded", { days: maxDurationDays }));
          return;
        }
      }
    }

    if (titleError || isCheckingTitle) return;

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      const trimmedLink = formData.link?.trim();
      if (trimmedLink) {
        payload.append("link_url", trimmedLink);
      }
      if (formData.startAt) payload.append("start_at", formData.startAt);
      if (formData.endAt) payload.append("end_at", formData.endAt);
      payload.append("ad_type", formData.adType);
      payload.append("priority", String(formData.priority));
      if (allowBrandingEnabled) {
        payload.append(
          "allow_branding",
          formData.allowBranding ? "true" : "false"
        );
      }
      payload.append(
        "target_roles",
        JSON.stringify(formData.targetRoles)
      );

      if (mediaType === "image" && formData.image instanceof Blob) {
        payload.append("image", formData.image);
      } else if (mediaType === "video" && videoFile) {
        payload.append("video", videoFile);
      }

      await onSubmit(payload, setUploadProgress);
      setFormData({
        title: "",
        description: "",
        image: null,
        startAt: "",
        endAt: "",
        targetRoles: [],
        adType: "promotion",
        priority: 0,
        link: "",
        allowBranding: false,
      });
      setMediaType("image");
    } catch (err) {
      const message = err?.response?.data?.message || tp("failed");
      setError(message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const startDateObj = formData.startAt
    ? new Date(formData.startAt)
    : null;
  const maxEndDate =
    !hideSchedule &&
    maxDurationDays !== null &&
    startDateObj &&
    !Number.isNaN(startDateObj.getTime())
      ? new Date(
          startDateObj.getTime() +
            maxDurationDays * 24 * 60 * 60 * 1000
        )
      : null;
  const maxEndDateStr = maxEndDate
    ? maxEndDate.toISOString().split("T")[0]
    : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir={i18n.dir()}>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
            🎯 {t("ad_details")}
          </h2>
        </header>
        <div className="px-5 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {t("title_label")} *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => {
                  setTitleError(null);
                  handleChange(e);
                }}
                className={`w-full border px-3 py-2 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  titleError ? "border-red-500" : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={t("title_placeholder")}
              />
              {isCheckingTitle && (
                <FaSpinner className="animate-spin text-gray-400" />
              )}
            </div>
            {titleError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {titleError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {t("description_label")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
              placeholder={t("description_placeholder")}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("media_type")} *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="image"
                  checked={mediaType === "image"}
                  onChange={handleMediaTypeChange}
                  className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                />
                <span className="flex items-center gap-1 text-sm">
                  <FaImage /> {t("image")}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={mediaType === "video"}
                  onChange={handleMediaTypeChange}
                  className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
                />
                <span className="flex items-center gap-1 text-sm">
                  <FaVideo /> {t("video")}
                </span>
              </label>
            </div>
          </div>

          {mediaType === "image" ? (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {t("image_label")} *
              </label>
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-contain rounded-lg border border-gray-200 dark:border-gray-700 mb-2 bg-gray-100 dark:bg-gray-700"
                  />
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t("remove_image")}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaImage className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{t("click_to_upload")}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("image_requirements")}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                {t("video_label")} *
              </label>
              {videoPreview ? (
                <div className="relative group">
                  <video
                    src={videoPreview}
                    className="w-full h-48 rounded-lg border border-gray-200 dark:border-gray-700 mb-2 bg-black"
                    controls
                  />
                  <button
                    type="button"
                    onClick={removeMedia}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title={t("remove_video")}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FaVideo className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">{t("click_to_upload")}</span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t("video_requirements")}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept={ALLOWED_VIDEO_TYPES.join(",")}
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {!hideSchedule && (
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
              🗓️ {t("schedule")}
            </h2>
          </header>
          <div className="px-5 py-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t("start_date")} *
                </label>
                <input
                  type="date"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  {t("end_date")}
                </label>
                <input
                  type="date"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  max={maxEndDateStr}
                  min={formData.startAt || undefined}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t("leave_end_blank")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
            👥 {t("target_audience")}
          </h2>
        </header>
        <div className="px-5 py-6 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("target_audience_help")}
          </p>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="targetRoles"
                value="student"
                checked={formData.targetRoles.includes("student")}
                onChange={handleChange}
                className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {tp("student")}
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="targetRoles"
                value="instructor"
                checked={formData.targetRoles.includes("instructor")}
                onChange={handleChange}
                className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {tp("instructor")}
              </span>
            </label>
          </div>
          {requireTargetRoles && formData.targetRoles.length === 0 && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("target_audience_required")}
            </p>
          )}
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-200">
            ⚙️ {t("configuration")}
          </h2>
        </header>
        <div className="px-5 py-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              {t("priority")}
            </label>
            <input
              type="number"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>

          {allowBrandingEnabled && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="allowBranding"
                checked={formData.allowBranding}
                onChange={handleChange}
                className="text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500 dark:focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {t("allow_branding")}
              </span>
            </div>
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={disableSubmit}
        className="w-full py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
      >
        {isSubmitting ? (
          <FaSpinner className="animate-spin inline-block" />
        ) : (
          submitLabel
        )}
      </button>
      {isSubmitting && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-yellow-500 h-2 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </form>
  );
}
