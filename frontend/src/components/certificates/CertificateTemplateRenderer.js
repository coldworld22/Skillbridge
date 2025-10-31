import QRCode from "react-qr-code";

const resolveAsset = (url, fallback) => {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith("/api/uploads/certificateTemplates/") ||
    trimmed.startsWith("/uploads/certificateTemplates/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    if (trimmed.startsWith("/uploads/certificateTemplates/")) {
      return `/api${trimmed}`;
    }
    return trimmed;
  }
  return fallback;
};

const DEFAULT_DATA = {
  id: "ABC123",
  studentName: "Student Name",
  courseName: "Course Title",
  issueDate: new Date().toISOString(),
  instructor: "Instructor Name",
  platformName: "Platform Name",
  grade: null,
  verificationUrl: null,
};

export default function CertificateTemplateRenderer({
  template = {},
  data,
  qrValue,
  className = "",
  style = {},
}) {
  const mergedData = {
    ...DEFAULT_DATA,
    ...(data || {}),
  };

  const borderColor =
    template.border_color ??
    template.borderColor ??
    "#FACC15";
  const fontFamily =
    template.font_family ??
    template.fontFamily ??
    "Georgia, serif";
  const titleFont =
    template.title_font ??
    template.titleFont ??
    "'Great Vibes', cursive";
  const showQr = template.show_qr ?? template.showQR ?? true;
  const background = resolveAsset(
    template.background ?? template.backgroundImage,
    "/images/paper-texture.png"
  );
  const logo = resolveAsset(
    template.logo,
    "/images/certificate/logo.png"
  );
  const certificateType = template.type || "Completion";

  const studentName =
    mergedData.studentName ||
    mergedData.user_name ||
    mergedData.userName ||
    "Student Name";
  const courseName =
    mergedData.courseName ||
    mergedData.course_title ||
    mergedData.className ||
    mergedData.tutorialTitle ||
    mergedData.courseTitle ||
    "Course Title";
  const instructorName =
    mergedData.instructor ||
    mergedData.instructorName ||
    mergedData.teacherName ||
    mergedData.issuedBy ||
    "Instructor Name";
  const platformName =
    mergedData.platformName ||
    mergedData.issuer ||
    mergedData.organization ||
    "Platform Name";

  const issueDate = mergedData.issueDate
    ? new Date(mergedData.issueDate).toLocaleDateString()
    : new Date().toLocaleDateString();
  const certificateCode =
    mergedData.certificate_code ||
    mergedData.certificateCode ||
    mergedData.code ||
    mergedData.id ||
    "CERT-000000";
  const grade = mergedData.grade;

  const qrTarget =
    qrValue ||
    mergedData.verificationUrl ||
    mergedData.verification_url ||
    `https://yourplatform.com/certificate/verify/${certificateCode}`;

  return (
    <div className={className}>
      <div
        className="w-full border-[12px] rounded-xl p-10 text-center relative shadow-[0_30px_70px_-30px_rgba(15,23,42,0.45)] overflow-hidden"
        style={{
          backgroundImage: `url('${background}')`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          borderColor,
          fontFamily,
          ...style,
        }}
      >
        <div className="absolute inset-0 bg-white/30 mix-blend-soft-light pointer-events-none" />
        <div className="relative z-10 space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-2">
            <img
              src={logo}
              alt="Certificate Logo"
              className="w-32 h-auto object-contain"
            />
          </div>

          {/* Title */}
          <h1
            className="text-5xl font-bold text-yellow-600 mb-4"
            style={{ fontFamily: titleFont }}
          >
            Certificate of {certificateType}
          </h1>

          <p className="text-lg text-gray-700">
            This certifies that
          </p>

          <h2 className="text-4xl font-extrabold text-gray-800">
            {studentName}
          </h2>

          <p className="text-lg text-gray-700">
            has successfully completed
          </p>

          <h3 className="text-2xl italic text-gray-700">
            "{courseName}"
          </h3>

          {grade && (
            <p className="text-lg text-gray-600">
              Final Grade:{" "}
              <span className="text-green-600 font-bold text-2xl">
                {grade}
              </span>
            </p>
          )}

          <div className="space-y-1 text-sm text-gray-600 mt-6">
            <p>
              Issued on:{" "}
              <strong>{issueDate}</strong>
            </p>
            <p>
              Serial Number:{" "}
              <strong>
                {String(certificateCode)
                  .replace(/\s+/g, "")
                  .toUpperCase()}
              </strong>
            </p>
          </div>

          {/* Footer Row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-8 px-4 mt-10 text-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-500">Instructor</p>
              <h4 className="font-bold text-gray-800">
                {instructorName}
              </h4>
              <img
                src="/images/certificate/instructor-signature.png"
                alt="Instructor Signature"
                className="w-28 mx-auto mt-3"
              />
            </div>

            {showQr && (
              <div className="text-center">
                <div className="bg-white border border-gray-200 p-2 rounded-md inline-flex items-center justify-center shadow-sm">
                  <QRCode value={qrTarget} size={86} />
                </div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-2">
                  Scan to verify
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm text-gray-500">Issued by</p>
              <h4 className="font-bold text-gray-800">
                {platformName}
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
