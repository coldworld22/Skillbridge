// pages/dashboard/instructor/certificates/preview/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import CertificateTemplateRenderer from "@/components/certificates/CertificateTemplateRenderer";
import { getCertificate } from "@/services/instructor/certificateService";

export default function CertificatePreviewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const template = certificate.template || {};
  const certificateData = {
    id: certificate.id,
    studentName: certificate.studentName,
    courseName: certificate.courseTitle || certificate.className,
    issueDate: certificate.issueDate,
    instructor: certificate.instructorName,
    platformName: certificate.platformName,
    grade: certificate.grade,
    verificationUrl: certificate.verificationUrl,
  };

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
        <div className="certificate-print-area w-full flex justify-center">
          <CertificateTemplateRenderer
            template={template}
            data={certificateData}
            className="w-full max-w-4xl"
          />
        </div>

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
