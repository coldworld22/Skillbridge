// pages/dashboard/student/certificates/view/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import StudentLayout from "@/components/layouts/StudentLayout";
import CertificateTemplateRenderer from "@/components/certificates/CertificateTemplateRenderer";
import { getCertificate } from "@/services/student/certificateService";

export default function StudentCertificateViewPage() {
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

  if (loading) return <div className="text-center mt-32 text-gray-700">Loading Certificate...</div>;
  if (error) return <div className="text-center mt-32 text-red-500">{error}</div>;
  if (!certificate) return null;

  const template = certificate.template || {};
  const certificateData = {
    id: certificate.id,
    studentName: certificate.studentName,
    courseName: certificate.className || certificate.courseTitle,
    issueDate: certificate.issueDate,
    instructor: certificate.instructorName,
    platformName: certificate.platformName,
    grade: certificate.grade,
    verificationUrl: certificate.verificationUrl,
  };

  return (
    <StudentLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">🎓 Certificate Details</h1>

          {/* Certificate Info */}
          <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">{certificate.courseTitle}</h2>
                <p className="text-sm text-gray-500">Certificate Code: {certificate.certificateCode}</p>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                certificate.status === "Issued" ? "bg-green-100 text-green-700" :
                certificate.status === "Revoked" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {certificate.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>Certificate ID:</strong> {certificate.id}</div>
              {certificate.issueDate && (
                <div><strong>Issue Date:</strong> {new Date(certificate.issueDate).toLocaleString()}</div>
              )}
              {certificate.verificationUrl && (
                <div className="md:col-span-2">
                  <strong>Verification URL:</strong>{" "}
                  <a
                    href={certificate.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all"
                  >
                    {certificate.verificationUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Certificate Preview */}
          {certificate.status === "Issued" && (
            <div className="mt-10">
              <CertificateTemplateRenderer
                template={template}
                data={certificateData}
                className="max-w-4xl mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
