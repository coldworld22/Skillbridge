import { FaTimes } from "react-icons/fa";
import QRCode from "react-qr-code";

const isTemplateAsset = (url) =>
  typeof url === "string" &&
  url.startsWith("/api/uploads/certificateTemplates/");

export default function CertificatePreviewModal({ template, onClose, mockData }) {
  if (!template) return null;

  const defaultData = {
    id: "ABC123",
    studentName: "Student Name",
    courseName: "Course Title",
    issueDate: new Date().toISOString().split("T")[0],
    instructor: "Instructor Name",
    platformName: "Platform Name",
    grade: "A+",
  };

  const data = { ...defaultData, ...(mockData || {}) };

  const {
    border_color,
    font_family,
    title_font,
    background = "/images/paper-texture.png",
    logo = "/images/certificate/logo.png",
    show_qr,
    borderColor: legacyBorderColor,
    fontFamily: legacyFontFamily,
    titleFont: legacyTitleFont,
    showQR: legacyShowQR,
  } = template;

  const borderColor = border_color ?? legacyBorderColor ?? "#FACC15";
  const fontFamily = font_family ?? legacyFontFamily ?? "Georgia, serif";
  const titleFont = title_font ?? legacyTitleFont ?? "'Great Vibes', cursive";
  const showQR = show_qr ?? legacyShowQR ?? true;
  const safeBackground = isTemplateAsset(background)
    ? background
    : "/images/paper-texture.png";
  const safeLogo = isTemplateAsset(logo)
    ? logo
    : "/images/certificate/logo.png";

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-black/60 flex items-center justify-center z-50">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-2xl shadow-2xl p-6 overflow-auto border border-gray-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 z-10"
        >
          <FaTimes size={20} />
        </button>

        {/* Certificate Design */}
        <div
          className="w-full border-[12px] rounded-xl p-10 text-center relative shadow-inner"
          style={{
            backgroundImage: `url('${safeBackground}')`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            borderColor,
            fontFamily,
          }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src={safeLogo} alt="Logo" className="w-32" />
          </div>

          {/* Title */}
          <h1
            className="text-5xl font-bold text-yellow-600 mb-6"
            style={{ fontFamily: titleFont }}
          >
            Certificate of {template.type || "Completion"}
          </h1>

          <p className="text-lg text-gray-700 mb-1">This certifies that</p>

          <h2 className="text-4xl font-extrabold text-gray-800 mb-4">{data.studentName}</h2>

          <p className="text-lg text-gray-700 mb-1">has successfully completed</p>

          <h3 className="text-2xl italic text-gray-700 mb-6">"{data.courseName}"</h3>

          {data.grade && (
            <p className="text-lg text-gray-600 mb-4">
              Final Grade: <span className="text-green-600 font-bold text-2xl">{data.grade}</span>
            </p>
          )}

          <p className="text-sm text-gray-500 mb-1">
            Issued on: <strong>{new Date(data.issueDate).toLocaleDateString()}</strong>
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Serial Number: <strong>CERT-{data.id.slice(0, 6).toUpperCase()}</strong>
          </p>

          {/* Footer Row */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 px-4 mt-8">
            {/* Instructor Signature */}
            <div className="text-center">
              <p className="text-sm text-gray-500">Instructor</p>
              <h4 className="font-bold text-gray-700">{data.instructor}</h4>
              <img
                src="/images/certificate/instructor-signature.png"
                alt="Instructor Signature"
                className="w-28 mx-auto mt-2"
              />
            </div>

            {/* QR Code */}
            {showQR && (
              <div className="text-center">
                <div className="bg-white border border-gray-200 p-2 rounded-md inline-block shadow-sm">
                  <QRCode
                    value={`https://yourplatform.com/certificate/verify/${data.id}`}
                    size={80}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Scan to Verify</p>
              </div>
            )}

            {/* Platform Signature */}
            <div className="text-center">
              <p className="text-sm text-gray-500">Issued by</p>
              <h4 className="font-bold text-gray-700">{data.platformName}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
