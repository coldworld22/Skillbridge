// pages/dashboard/instructor/certificates/preview/[id].js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import QRCode from "react-qr-code";
import { getCertificate } from "@/services/instructor/certificateService";

const FALLBACK_BACKGROUND = "/images/paper-texture.png";
const FALLBACK_LOGO = "/images/certificate/logo.png";
const FALLBACK_BORDER_COLOR = "#FACC15";
const FALLBACK_FONT_FAMILY = "Georgia, serif";
const FALLBACK_TITLE_FONT = "'Great Vibes', cursive";

const firstDefined = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== "");

const sanitizeAsset = (value, fallback) =>
  typeof value === "string" && value.trim().length > 0 ? value : fallback;

const deriveTemplateSettings = (certificate) => {
  const template = certificate?.template ?? {};

  const borderColor =
    firstDefined(
      template.border_color,
      template.borderColor,
      certificate?.border_color,
      certificate?.borderColor,
      FALLBACK_BORDER_COLOR
    ) || FALLBACK_BORDER_COLOR;

  const fontFamily =
    firstDefined(
      template.font_family,
      template.fontFamily,
      certificate?.font_family,
      certificate?.fontFamily,
      FALLBACK_FONT_FAMILY
    ) || FALLBACK_FONT_FAMILY;

  const titleFont =
    firstDefined(
      template.title_font,
      template.titleFont,
      certificate?.title_font,
      certificate?.titleFont,
      FALLBACK_TITLE_FONT
    ) || FALLBACK_TITLE_FONT;

  const background = sanitizeAsset(
    firstDefined(
      template.background,
      template.backgroundUrl,
      certificate?.background,
      certificate?.backgroundImage
    ),
    FALLBACK_BACKGROUND
  );

  const logo = sanitizeAsset(
    firstDefined(
      template.logo,
      template.logoUrl,
      certificate?.logo,
      certificate?.logoUrl
    ),
    FALLBACK_LOGO
  );

  const showQrPreference = firstDefined(
    template.show_qr,
    template.showQr,
    certificate?.show_qr,
    certificate?.showQR
  );

  return {
    borderColor,
    fontFamily,
    titleFont,
    background,
    logo,
    accentColor: borderColor,
    showQR: showQrPreference === undefined ? true : Boolean(showQrPreference),
  };
};

export default function CertificatePreviewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const templateSettings = useMemo(
    () => deriveTemplateSettings(certificate),
    [certificate]
  );

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const data = await getCertificate(id);
        setCertificate(data);
      } catch (err) {
        console.error('Failed to load certificate', err);
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="text-gray-700 p-10">Loading certificate...</div>;
  if (error) return <div className="text-red-500 p-10">{error}</div>;
  if (!certificate) return null;

  const {
    borderColor,
    fontFamily,
    titleFont,
    background,
    logo,
    accentColor,
    showQR,
  } = templateSettings;

  const formattedIssueDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString()
    : "N/A";

  const certificateSerial = certificate.id
    ? certificate.id.slice(0, 6).toUpperCase()
    : "------";

  const verificationUrl = firstDefined(
    certificate.verificationUrl,
    certificate.verification_url,
    certificate.verificationLink,
    certificate.verification_link,
    certificate.id ? `https://yourplatform.com/certificate/verify/${certificate.id}` : ""
  );

  return (
    <InstructorLayout>
      {/* ✅ PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, footer, nav, button {
            display: none !important;
          }
          .certificate-print-area {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            width: 100vw;
            margin: 0;
            padding: 0;
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <div className="min-h-screen bg-white px-6 py-10 flex flex-col items-center justify-center">
        
        {/* ✅ Print Area */}
        <div className="certificate-print-area">
          {/* Certificate Card */}
          <div
            className="w-full max-w-4xl bg-white border-[12px] rounded-2xl p-12 text-center shadow-2xl relative"
            style={{
              backgroundImage: `url('${background}')`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              fontFamily,
              borderColor,
            }}
          >

            {/* Logo inside certificate */}
            <div className="w-full flex justify-center mb-4">
              <img src={logo} alt="SkillBridge Logo" className="w-32" />
            </div>

            {/* Certificate Title */}
            <h1
              className="text-5xl font-bold mb-8"
              style={{ fontFamily: titleFont, color: accentColor }}
            >
              Certificate of Completion
            </h1>

            <p className="text-lg text-gray-600 mb-2">This certifies that</p>

            <h2 className="text-4xl font-extrabold text-gray-800 mb-6">{certificate.studentName}</h2>

            <p className="text-lg text-gray-600 mb-2">has successfully completed</p>

            <h3 className="text-2xl font-semibold text-gray-700 mb-6">"{certificate.courseTitle}"</h3>

            {/* Grade */}
            {certificate.grade && (
              <p className="text-lg text-gray-600 mb-6">
                Final Grade: <span className="text-green-600 font-bold text-2xl">{certificate.grade}</span>
              </p>
            )}

            {/* Issue Date and Serial */}
            <p className="text-sm text-gray-500 mb-2">
              Issued on: <strong>{formattedIssueDate}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Serial Number: <strong>CERT-{certificateSerial}</strong>
            </p>

            {/* Bottom Signature / QR Section */}
            <div className="flex justify-between items-center px-8 mt-10">

              {/* Instructor Signature */}
              <div className="text-center">
                <p className="text-sm text-gray-500">Instructor</p>
                <h4 className="font-bold text-gray-700">{certificate.instructorName}</h4>
                <img src="/images/certificate/instructor-signature.png" alt="Instructor Signature" className="w-28 mx-auto mt-2" />
              </div>

              {/* QR Code */}
              {showQR && verificationUrl && (
                <div className="text-center">
                  <div className="bg-white p-2 rounded-lg inline-block">
                    <QRCode value={verificationUrl} size={80} />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Scan to Verify</p>
                </div>
              )}

              {/* Platform Signature */}
              <div className="text-center">
                <p className="text-sm text-gray-500">Issued by</p>
                <h4 className="font-bold text-gray-700">{certificate.platformName}</h4>
              </div>

            </div>

          </div> {/* End of Certificate */}
        </div> {/* End of Print Area */}

        {/* ✅ Print Button */}
        <button
          onClick={() => window.print()}
          className="mt-8 text-black font-bold py-2 px-6 rounded-lg shadow-md"
          style={{ backgroundColor: accentColor }}
        >
          📄 Print Certificate
        </button>

      </div>
    </InstructorLayout>
  );
}
