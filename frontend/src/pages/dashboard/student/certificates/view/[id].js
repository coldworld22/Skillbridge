// pages/dashboard/admin/certificates/view/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import StudentLayout from "@/components/layouts/StudentLayout";
import { FaCheckCircle, FaTimesCircle, FaDownload } from "react-icons/fa";

export default function AdminCertificateViewPage() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);
  const [status, setStatus] = useState("Pending");

  useEffect(() => {
    if (id) {
      // Mock loading certificate
      setCertificate({
        id,
        studentName: "Sara Ali",
        className: "React & Next.js Bootcamp",
        issueDate: "2025-05-30T10:00:00Z",
        status: "Pending", // or 'Issued'
      });
      setStatus("Pending");
    }
  }, [id]);

  const handleIssueCertificate = () => {
    setStatus("Issued");
    alert("✅ Certificate Issued Successfully!");
    // TODO: Save update to backend
  };

  const handleRevokeCertificate = () => {
    if (confirm("⚠️ Are you sure you want to revoke this certificate?")) {
      setStatus("Revoked");
      alert("❌ Certificate Revoked.");
      // TODO: Save update to backend
    }
  };

  if (!certificate) return <div className="text-center mt-32 text-gray-700">Loading Certificate...</div>;

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
                  onClick={() => alert('🚀 Download will start soon (mock)!')}
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
            <div className="mt-10 p-10 bg-yellow-100 rounded-lg shadow-md text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🎉 Congratulations!</h2>
              <p className="text-lg text-gray-700">{certificate.studentName}</p>
              <p className="text-sm text-gray-600">has successfully completed</p>
              <p className="font-bold text-xl text-gray-800 mt-2">{certificate.className}</p>
              <p className="text-xs text-gray-500 mt-4">Issued on {new Date(certificate.issueDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
