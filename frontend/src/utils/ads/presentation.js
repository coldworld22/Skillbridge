import { AD_STATUS } from "./lifecycle";

const STATUS_LABEL_KEYS = {
  [AD_STATUS.RUNNING]: "running",
  [AD_STATUS.PAUSED]: "paused",
  [AD_STATUS.SCHEDULED]: "scheduled",
  [AD_STATUS.EXPIRED]: "expired",
};

const STATUS_DEFAULT_LABELS = {
  [AD_STATUS.RUNNING]: "Running",
  [AD_STATUS.PAUSED]: "Paused",
  [AD_STATUS.SCHEDULED]: "Scheduled",
  [AD_STATUS.EXPIRED]: "Expired",
  unknown: "Status",
};

const STATUS_BADGE_VARIANTS = {
  [AD_STATUS.RUNNING]: "running",
  [AD_STATUS.PAUSED]: "paused",
  [AD_STATUS.SCHEDULED]: "scheduled",
  [AD_STATUS.EXPIRED]: "expired",
};

const formatDate = (isoString, locale) => {
  if (!isoString) return null;
  try {
    return new Intl.DateTimeFormat(locale || undefined, {
      dateStyle: "medium",
    }).format(new Date(isoString));
  } catch (_err) {
    return new Date(isoString).toLocaleDateString?.() || isoString;
  }
};

export const getAdStatusLabel = (status, t) => {
  const key = STATUS_LABEL_KEYS[status] || "unknown";
  const fallback =
    STATUS_DEFAULT_LABELS[status] || STATUS_DEFAULT_LABELS.unknown;
  return t(`adsPage.status_${key}`, { defaultValue: fallback });
};

export const getAdStatusClasses = (status) =>
  STATUS_BADGE_VARIANTS[status] || "default";

export const describeAdLifecycle = (lifecycle, t, locale) => {
  if (!lifecycle) return null;
  const startDate = formatDate(lifecycle.startDate, locale);
  const endDate = formatDate(lifecycle.endDate, locale);

  switch (lifecycle.status) {
    case AD_STATUS.RUNNING:
      if (endDate) {
        return t("adsPage.status_desc_running_until", {
          defaultValue: "Running — ends on {{date}}",
          date: endDate,
        });
      }
      return t("adsPage.status_desc_running_open", {
        defaultValue: "Running with no scheduled end date",
      });
    case AD_STATUS.PAUSED:
      return t("adsPage.status_desc_paused", {
        defaultValue: "Paused — reactivate to resume delivery",
      });
    case AD_STATUS.SCHEDULED:
      return t("adsPage.status_desc_scheduled", {
        defaultValue: "Scheduled to start on {{date}}",
        date: startDate || t("adsPage.status_desc_scheduled_fallback", {
          defaultValue: "the selected start date",
        }),
      });
    case AD_STATUS.EXPIRED:
      return t("adsPage.status_desc_expired", {
        defaultValue: endDate
          ? "Expired on {{date}}"
          : "Expired — outside the scheduled window",
        date: endDate,
      });
    default:
      return null;
  }
};
