// pages/dashboard/admin/certificates/view/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import StudentLayout from "@/components/layouts/StudentLayout";
import CertificateTemplateRenderer from "@/components/certificates/CertificateTemplateRenderer";
import { FaCheckCircle, FaTimesCircle, FaDownload } from "react-icons/fa";
import {
  getCertificate,
  issueCertificate,
  revokeCertificate,
  downloadCertificate,
} from "@/services/student/certificateService";

export default function AdminCertificateViewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);
  const [status, setStatus] = useState("Pending");
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
        setStatus(data?.status || 'Pending');
      } catch (err) {
        console.error('Failed to load certificate', err);
        setError('Failed to load certificate');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleIssueCertificate = async () => {
    try {
      await issueCertificate(id);
      setStatus('Issued');
    } catch (err) {
      alert('Issue failed');
    }
  };

  const handleRevokeCertificate = async () => {
    if (!confirm("⚠️ Are you sure you want to revoke this certificate?")) return;
    try {
      await revokeCertificate(id);
      setStatus('Revoked');
    } catch (err) {
      alert('Revoke failed');
    }
  };

  const handleDownload = async () => {
    try {
      const blob = await downloadCertificate(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Download failed');
    }
  };

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
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">🎓 View Certificate</h1>

          {/* Certificate Info */}
          <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">{certificate.studentName}</h2>
                <p className="text-sm text-gray-500">Class: {certificate.className}</p>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                status === "Issued" ? "bg-green-100 text-green-700" :
                status === "Revoked" ? "bg-red-100 text-red-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>
                {status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>Certificate ID:</strong> {certificate.id}</div>
              <div><strong>Issue Date:</strong> {new Date(certificate.issueDate).toLocaleString()}</div>
            </div>

            {/* Admin Actions */}
            {status === "Pending" && (
              <div className="flex gap-4 pt-6">
                <button
                  onClick={handleIssueCertificate}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <FaCheckCircle /> Issue Certificate
                </button>
                <button
                  onClick={handleRevokeCertificate}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <FaTimesCircle /> Reject Certificate
                </button>
              </div>
            )}

            {status === "Issued" && (
              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <FaDownload /> Download Certificate
                </button>
                <button
                  onClick={handleRevokeCertificate}
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <FaTimesCircle /> Revoke Certificate
                </button>
              </div>
            )}
          </div>

          {/* Certificate Preview */}
          {status === "Issued" && (
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
