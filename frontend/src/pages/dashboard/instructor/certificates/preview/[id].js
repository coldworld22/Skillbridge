// pages/dashboard/instructor/certificates/preview/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import QRCode from "react-qr-code";
import { NotebookTabs } from "lucide-react";

export default function CertificatePreviewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    if (id) {
      // Mock data fetch
      setCertificate({
        id,
        studentName: "Ahmed Mohamed",
        courseTitle: "React & Next.js Bootcamp",
        issueDate: "2025-05-01",
        instructorName: "Ayman Khalid",
        platformName: "SkillBridge Academy",
        grade: "95%", // Optional grade
      });
    }
  }, [id]);

  if (!certificate) return <div className="text-gray-700 p-10">Loading certificate...</div>;

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
          <div className="w-full max-w-4xl bg-white border-[12px] border-yellow-400 rounded-2xl p-12 text-center shadow-2xl relative" style={{
            backgroundImage: "url('/images/paper-texture.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            fontFamily: "Georgia, serif",
          }}>

            {/* Logo inside certificate */}
            <div className="w-full flex justify-center mb-4">
              <img src="/images/certificate/logo.png" alt="SkillBridge Logo" className="w-32" />
            </div>

            {/* Certificate Title */}
            <h1 className="text-5xl font-bold text-yellow-600 mb-8" style={{ fontFamily: "'Great Vibes', cursive" }}>
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
              <div className="text-center">
                <div className="bg-white p-2 rounded-lg inline-block">
                  <QRCode value={`https://yourplatform.com/certificate/verify/${certificate.id}`} size={80} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Scan to Verify</p>
              </div>

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
          className="mt-8 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-lg shadow-md"
        >
          📄 Print Certificate
        </button>

      </div>
    </InstructorLayout>
  );
}
// iomportant NotebookTabs


// we did admin certifcate templats so it pulled from it