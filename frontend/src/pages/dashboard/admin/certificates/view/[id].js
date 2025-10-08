// pages/dashboard/admin/certificates/view/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaDownload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import {
  getCertificate,
  approveCertificate,
  rejectCertificate,
  downloadCertificate,
} from "@/services/admin/certificateService";

export default function ViewCertificatePage() {
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

  if (loading) return <div className="text-center text-gray-600 p-10">Loading certificate...</div>;
  if (error) return <div className="text-center text-red-500 p-10">{error}</div>;
  if (!certificate) return null;

  const handleApprove = async () => {
    try {
      await approveCertificate(id);
      router.push("/dashboard/admin/certificates");
    } catch {
      alert('Failed to approve');
    }
  };

  const handleReject = async () => {
    if (!confirm("❌ Are you sure you want to reject this certificate?")) return;
    try {
      await rejectCertificate(id);
      router.push("/dashboard/admin/certificates");
    } catch {
      alert('Failed to reject');
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
    } catch {
      alert('Download failed');
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">🎓 Certificate Details</h1>

          {/* Certificate Details */}
          <div className="bg-gray-100 p-6 rounded-xl shadow-md space-y-4">
            <h2 className="text-xl font-semibold">{certificate.studentName}</h2>
            <p><strong>Class:</strong> {certificate.className}</p>
            <p><strong>Issue Date:</strong> {new Date(certificate.issueDate).toLocaleDateString()}</p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                certificate.status === "Issued" ? "bg-green-100 text-green-700" :
                certificate.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              }`}>
                {certificate.status}
              </span>
            </p>

            {/* Certificate Preview */}
            <div className="mt-6 text-center">
              <img
                src={certificate.certificateUrl}
                alt="Certificate Preview"
                className="mx-auto rounded-lg shadow-md max-w-full h-auto"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 mt-8">
              {certificate.status === "Pending" && (
                <>
                  <button
                    onClick={handleApprove}
                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <FaCheckCircle /> Approve
                  </button>

                  <button
                    onClick={handleReject}
                    className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                  >
                    <FaTimesCircle /> Reject
                  </button>
                </>
              )}
              {certificate.status === "Issued" && (
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                >
                  <FaDownload /> Download
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
