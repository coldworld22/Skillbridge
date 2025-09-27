import { useEffect, useMemo } from "react";
import { FaTimes } from "react-icons/fa";
import QRCode from "react-qr-code";

const DEFAULT_PLATFORM_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SkillBridge";
const FALLBACK_VERIFICATION_BASE = (() => {
  const domain =
    process.env.NEXT_PUBLIC_APP_DOMAIN ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "";

  if (!domain) {
    return "https://example.com";
  }

  return domain.startsWith("http") ? domain : `https://${domain}`;
})();

const FIELD_MAPPINGS = [
  { target: "id", keys: ["id", "sample_id", "certificate_id"] },
  { target: "studentName", keys: ["studentName", "student_name", "student"] },
  { target: "courseName", keys: ["courseName", "course_name", "course_title"] },
  { target: "issueDate", keys: ["issueDate", "issue_date", "issued_at"] },
  { target: "instructor", keys: ["instructor", "instructor_name", "teacher"] },
  { target: "platformName", keys: ["platformName", "platform_name", "issuer"] },
  { target: "grade", keys: ["grade", "final_grade", "score"] },
  {
    target: "certificateCode",
    keys: ["certificateCode", "certificate_code", "serial", "serial_number", "code"],
  },
  {
    target: "certificateUrl",
    keys: ["certificateUrl", "certificate_url", "verificationUrl", "verification_url"],
  },
];

const parseJsonMaybe = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse certificate preview JSON", error);
    return null;
  }
};

const normalizeCertificatePayload = (payload) => {
  const source = parseJsonMaybe(payload);

  if (!source || typeof source !== "object") {
    return {};
  }

  const normalized = {};

  for (const { target, keys } of FIELD_MAPPINGS) {
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
        normalized[target] = source[key];
        break;
      }
    }
  }

  if (source.sample_data) {
    Object.assign(normalized, normalizeCertificatePayload(source.sample_data));
  }

  if (source.sampleData) {
    Object.assign(normalized, normalizeCertificatePayload(source.sampleData));
  }

  if (normalized.issueDate instanceof Date) {
    normalized.issueDate = normalized.issueDate.toISOString();
  }

  return normalized;
};

const buildDefaultPreviewData = (template) => {
  const now = new Date();
  const fallbackId = template?.id || `preview-${now.getTime()}`;
  const courseName = template?.name ? `${template.name} Course` : "Sample Course";

  return {
    id: fallbackId,
    studentName: "Sample Student",
    courseName,
    issueDate: now.toISOString(),
    instructor: "Sample Instructor",
    platformName: DEFAULT_PLATFORM_NAME,
    grade: "A+",
    certificateCode: `PREVIEW-${String(fallbackId).slice(0, 8).toUpperCase()}`,
  };
};

const sanitizeTemplateImage = (value, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  return fallback;
};

const resolveTemplateStyles = (template) => {
  const borderColor = template?.border_color ?? template?.borderColor ?? "#FACC15";
  const fontFamily = template?.font_family ?? template?.fontFamily ?? "Georgia, serif";
  const titleFont = template?.title_font ?? template?.titleFont ?? "'Great Vibes', cursive";
  const showQRSetting = template?.show_qr ?? template?.showQR;
  const backgroundValue =
    template?.background ?? template?.background_image ?? template?.backgroundUrl;
  const logoValue = template?.logo ?? template?.logo_url ?? template?.logoUrl;

  return {
    borderColor,
    fontFamily,
    titleFont,
    showQR: typeof showQRSetting === "boolean" ? showQRSetting : true,
    backgroundImage: sanitizeTemplateImage(backgroundValue, "/images/paper-texture.png"),
    logoImage: sanitizeTemplateImage(logoValue, "/images/certificate/logo.png"),
  };
};

const buildVerificationUrl = (serialValue, data) => {
  const explicitUrl = data.certificateUrl;
  if (explicitUrl && typeof explicitUrl === "string" && explicitUrl.trim()) {
    return explicitUrl.trim();
  }

  const base = FALLBACK_VERIFICATION_BASE.replace(/\/$/, "");
  return `${base}/certificate/verify/${encodeURIComponent(serialValue)}`;
};

export default function CertificatePreviewModal({
  template,
  previewData,
  loadingPreview = false,
  onClose,
}) {
  const templateData = template || {};

  useEffect(() => {
    const originalOverflow = typeof document !== "undefined" ? document.body.style.overflow : "";

    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }

    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = originalOverflow;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const { borderColor, fontFamily, titleFont, showQR, backgroundImage, logoImage } = useMemo(
    () => resolveTemplateStyles(templateData),
    [templateData],
  );

  const resolvedData = useMemo(() => {
    const defaults = buildDefaultPreviewData(templateData);
    const sampleData = normalizeCertificatePayload(
      templateData.sample_data ?? templateData.sampleData,
    );
    const previewOverrides = normalizeCertificatePayload(previewData);

    const merged = {
      ...defaults,
      ...sampleData,
      ...previewOverrides,
    };

    if (!merged.certificateCode && merged.id) {
      merged.certificateCode = `PREVIEW-${String(merged.id).slice(0, 8).toUpperCase()}`;
    }

    return merged;
  }, [templateData, previewData]);

  const serialValue = useMemo(() => {
    const raw =
      resolvedData.certificateCode || resolvedData.certificateId || resolvedData.id || "";
    const trimmed = String(raw).trim();
    return trimmed ? trimmed.toUpperCase() : "PREVIEW-000000";
  }, [resolvedData]);

  const issueDateLabel = useMemo(() => {
    if (!resolvedData.issueDate) {
      return null;
    }

    const date = new Date(resolvedData.issueDate);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString();
  }, [resolvedData.issueDate]);

  const verificationUrl = useMemo(
    () => buildVerificationUrl(serialValue, resolvedData),
    [resolvedData, serialValue],
  );

  const effectiveLoading = Boolean(loadingPreview && !previewData);
  const certificateType = templateData.type || "Completion";

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      role="dialog"
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 transition hover:text-red-500"
          aria-label="Close certificate preview"
        >
          <FaTimes size={20} />
        </button>

        <div
          className="relative w-full border-[12px] rounded-xl p-10 text-center shadow-inner"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            borderColor,
            fontFamily,
          }}
        >
          {effectiveLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/75 backdrop-blur-sm">
              <span className="text-gray-600">Loading preview...</span>
            </div>
          )}

          <div className="mb-6 flex justify-center">
            <img src={logoImage} alt="Certificate logo" className="h-24 w-24 object-contain" />
          </div>

          <h1 className="mb-6 text-5xl font-bold text-yellow-600" style={{ fontFamily: titleFont }}>
            Certificate of {certificateType}
          </h1>

          <p className="mb-1 text-lg text-gray-700">This certifies that</p>

          <h2 className="mb-4 text-4xl font-extrabold text-gray-800">
            {resolvedData.studentName}
          </h2>

          <p className="mb-1 text-lg text-gray-700">has successfully completed</p>

          <h3 className="mb-6 text-2xl italic text-gray-700">“{resolvedData.courseName}”</h3>

          {resolvedData.grade && (
            <p className="mb-4 text-lg text-gray-600">
              Final Grade: <span className="text-2xl font-bold text-green-600">{resolvedData.grade}</span>
            </p>
          )}

          <p className="mb-1 text-sm text-gray-500">
            Issued on: <strong>{issueDateLabel || "Pending"}</strong>
          </p>
          <p className="mb-6 text-sm text-gray-500">
            Serial Number: <strong>{serialValue}</strong>
          </p>

          <div className="mt-8 flex flex-col items-center gap-6 px-4 sm:flex-row sm:justify-between">
            <div className="text-center">
              <p className="text-sm text-gray-500">Instructor</p>
              <h4 className="font-bold text-gray-700">{resolvedData.instructor}</h4>
              <img
                src="/images/certificate/instructor-signature.png"
                alt="Instructor signature"
                className="mx-auto mt-2 w-28"
              />
            </div>

            {showQR && (
              <div className="text-center">
                <div className="inline-block rounded-md border border-gray-200 bg-white p-2 shadow-sm">
                  <QRCode value={verificationUrl} size={96} />
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-500">Scan to verify</p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">Issued by</p>
              <h4 className="font-bold text-gray-700">{resolvedData.platformName}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
