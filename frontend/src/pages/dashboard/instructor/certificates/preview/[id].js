// pages/dashboard/instructor/certificates/preview/[id].js
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import QRCode from "react-qr-code";
import { getCertificate } from "@/services/instructor/certificateService";
import { getTemplate } from "@/services/admin/certificateTemplateService";

export default function CertificatePreviewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [template, setTemplate] = useState(null);
  const [templateError, setTemplateError] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const data = await getCertificate(id);
        setCertificate(data);
        setTemplate(data?.template ?? null);
      } catch (err) {
        console.error('Failed to load certificate', err);
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!certificate) {
      setTemplate(null);
      setTemplateError("");
      setTemplateLoading(false);
      return;
    }

    if (certificate.template || template) {
      if (certificate.template && template !== certificate.template) {
        setTemplate(certificate.template);
      }
      setTemplateError("");
      setTemplateLoading(false);
      return;
    }

    const templateId =
      certificate.templateId ??
      certificate.template_id ??
      certificate.template?.id;

    if (!templateId) {
      setTemplate(null);
      setTemplateError("");
      setTemplateLoading(false);
      return;
    }

    let ignore = false;
    setTemplateLoading(true);
    setTemplateError("");

    getTemplate(templateId)
      .then((tpl) => {
        if (ignore) return;
        setTemplate(tpl);
        setCertificate((prev) => (prev ? { ...prev, template: tpl } : prev));
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Failed to load certificate template", err);
        setTemplateError("Failed to load certificate template.");
      })
      .finally(() => {
        if (ignore) return;
        setTemplateLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [certificate, template]);

  if (loading) return <div className="text-gray-700 p-10">Loading certificate...</div>;
  if (error) return <div className="text-red-500 p-10">{error}</div>;
  if (!certificate) return null;

  const activeTemplate = useMemo(
    () => template ?? certificate?.template ?? {},
    [certificate, template]
  );

  const backgroundImage = activeTemplate.background || "/images/paper-texture.png";
  const backgroundStyle =
    typeof backgroundImage === "string" && backgroundImage.includes("url(")
      ? backgroundImage
      : `url('${backgroundImage}')`;
  const logoUrl = activeTemplate.logo || "/images/certificate/logo.png";
  const borderColor =
    activeTemplate.borderColor ||
    activeTemplate.border_color ||
    "#FACC15";
  const bodyFont = activeTemplate.fontFamily || activeTemplate.font_family || "Georgia, serif";
  const titleFont = activeTemplate.titleFont || activeTemplate.title_font || "'Great Vibes', cursive";
  const showQr = (activeTemplate.showQr ?? activeTemplate.show_qr) !== false;

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
              backgroundImage: backgroundStyle,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              fontFamily: bodyFont,
              borderColor,
            }}
          >

            {/* Logo inside certificate */}
            <div className="w-full flex justify-center mb-4">
              <img src={logoUrl} alt="Certificate Logo" className="w-32" />
            </div>

            {/* Certificate Title */}
            <h1
              className="text-5xl font-bold mb-8"
              style={{ fontFamily: titleFont, color: borderColor }}
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
              Issued on: <strong>{new Date(certificate.issueDate).toLocaleDateString()}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-8">
              Serial Number: <strong>CERT-{certificate.id.slice(0, 6).toUpperCase()}</strong>
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
              {showQr && (
                <div className="text-center">
                  <div className="bg-white p-2 rounded-lg inline-block">
                    <QRCode value={`https://yourplatform.com/certificate/verify/${certificate.id}`} size={80} />
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
        <div className="flex flex-col items-center gap-2 mt-6">
          {templateLoading && (
            <span className="text-sm text-gray-500">Loading template settings...</span>
          )}
          {templateError && (
            <span className="text-sm text-red-500">{templateError}</span>
          )}
          <button
            onClick={() => window.print()}
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg shadow-md"
          >
            📄 Print Certificate
          </button>
        </div>

      </div>
    </InstructorLayout>
  );
}
