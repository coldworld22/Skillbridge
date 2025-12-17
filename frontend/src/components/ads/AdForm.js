import { useState, useEffect } from "react";
import { useTranslation } from "next-i18next";
import { FaSpinner, FaTrash, FaImage, FaVideo } from "react-icons/fa";
import useAdMedia, {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
} from "@/hooks/useAdMedia";
import { Button } from "@/components/ui/button";
import styles from "./AdForm.module.scss";

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
    <form onSubmit={handleSubmit} className={styles.form} dir={i18n.dir()}>
      {error && (
        <div className={styles.alert}>
          {error}
        </div>
      )}

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            🎯 {t("ad_details")}
          </h2>
        </header>
        <div className={styles.sectionBody}>
          <div>
            <label className={styles.label}>
              {t("title_label")} *
            </label>
            <div className={styles.flexRow}>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) => {
                  setTitleError(null);
                  handleChange(e);
                }}
                className={styles.input}
                placeholder={t("title_placeholder")}
              />
              {isCheckingTitle && (
                <FaSpinner className={styles.spinner} />
              )}
            </div>
            {titleError && (
              <p className={styles.errorText}>
                {titleError}
              </p>
            )}
          </div>

          <div>
            <label className={styles.label}>
              {t("description_label")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className={styles.textarea}
              placeholder={t("description_placeholder")}
            />
          </div>

          <div>
            <label className={styles.label}>
              {t("media_type")} *
            </label>
            <div className={styles.radioRow}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="mediaType"
                  value="image"
                  checked={mediaType === "image"}
                  onChange={handleMediaTypeChange}
                />
                <span className={styles.inlineOption}>
                  <FaImage /> {t("image")}
                </span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={mediaType === "video"}
                  onChange={handleMediaTypeChange}
                />
                <span className={styles.inlineOption}>
                  <FaVideo /> {t("video")}
                </span>
              </label>
            </div>
          </div>

          {mediaType === "image" ? (
            <div>
              <label className={styles.label}>
                {t("image_label")} *
              </label>
              {imagePreview ? (
                <div className={styles.mediaPreview}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className={styles.mediaImg}
                  />
                  <button
                    type="button"
                    onClick={removeMedia}
                    className={styles.removeMedia}
                    title={t("remove_image")}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ) : (
                <label className={styles.dropzone}>
                  <div className={styles.dropContent}>
                    <FaImage className={styles.dropIcon} />
                    <p className={styles.dropTitle}>{t("click_to_upload")}</p>
                    <p className={styles.dropHint}>{t("image_requirements")}</p>
                  </div>
                  <input
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(",")}
                    onChange={handleImageChange}
                    className={styles.hiddenInput}
                  />
                </label>
              )}
            </div>
          ) : (
            <div>
              <label className={styles.label}>
                {t("video_label")} *
              </label>
              {videoPreview ? (
                <div className={styles.mediaPreview}>
                  <video
                    src={videoPreview}
                    className={styles.mediaVideo}
                    controls
                  />
                  <button
                    type="button"
                    onClick={removeMedia}
                    className={styles.removeMedia}
                    title={t("remove_video")}
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ) : (
                <label className={styles.dropzone}>
                  <div className={styles.dropContent}>
                    <FaVideo className={styles.dropIcon} />
                    <p className={styles.dropTitle}>{t("click_to_upload")}</p>
                    <p className={styles.dropHint}>{t("video_requirements")}</p>
                  </div>
                  <input
                    type="file"
                    accept={ALLOWED_VIDEO_TYPES.join(",")}
                    onChange={handleVideoChange}
                    className={styles.hiddenInput}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </section>

      {!hideSchedule && (
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              🗓️ {t("schedule")}
            </h2>
          </header>
          <div className={styles.sectionBody}>
            <div className={styles.gridTwo}>
              <div>
                <label className={styles.label}>
                  {t("start_date")} *
                </label>
                <input
                  type="date"
                  name="startAt"
                  value={formData.startAt}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>
                  {t("end_date")}
                </label>
                <input
                  type="date"
                  name="endAt"
                  value={formData.endAt}
                  onChange={handleChange}
                  max={maxEndDateStr}
                  min={formData.startAt || undefined}
                  className={styles.input}
                />
                <p className={styles.helper}>
                  {t("leave_end_blank")}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            👥 {t("target_audience")}
          </h2>
        </header>
        <div className={styles.sectionBody}>
          <p className={styles.helper}>
            {t("target_audience_help")}
          </p>
          <div className={styles.radioRow}>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="targetRoles"
                value="student"
                checked={formData.targetRoles.includes("student")}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span className={styles.inlineOption}>
                {tp("student")}
              </span>
            </label>
            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="targetRoles"
                value="instructor"
                checked={formData.targetRoles.includes("instructor")}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span className={styles.inlineOption}>
                {tp("instructor")}
              </span>
            </label>
          </div>
          {requireTargetRoles && formData.targetRoles.length === 0 && (
            <p className={styles.errorText}>
              {t("target_audience_required")}
            </p>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <header className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            ⚙️ {t("configuration")}
          </h2>
        </header>
        <div className={styles.sectionBody}>
          <div>
            <label className={styles.label}>
              {t("priority")}
            </label>
            <input
              type="number"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              min={0}
              className={styles.input}
            />
          </div>

          {allowBrandingEnabled && (
            <div className={styles.toggleRow}>
              <input
                type="checkbox"
                name="allowBranding"
                checked={formData.allowBranding}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <span className={styles.inlineOption}>
                {t("allow_branding")}
              </span>
            </div>
          )}
        </div>
      </section>

      <Button
        type="submit"
        disabled={disableSubmit}
        variant="accent"
        className={styles.submit}
      >
        {isSubmitting ? <FaSpinner className={styles.spinner} /> : submitLabel}
      </Button>
      {isSubmitting && (
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}
    </form>
  );
}
