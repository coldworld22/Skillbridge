// pages/dashboard/admin/certificates/view/[id].js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaDownload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function ViewCertificatePage() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    if (id) {
      // TODO: Replace with real fetch from API later
      setCertificate({
        id,
        studentName: "Sara Ali",
        className: "React & Next.js Bootcamp",
        issueDate: "2025-05-30T10:00:00Z",
        status: "Pending",
        certificateUrl: "https://via.placeholder.com/600x400.png?text=Certificate+Preview",
      });
    }
  }, [id]);

  if (!certificate) {
    return <div className="text-center text-gray-600 p-10">Loading certificate...</div>;
  }

  const handleApprove = () => {
    alert("✅ Certificate Approved Successfully (mock)!");
    // TODO: Send approve request to backend
    router.push("/dashboard/admin/certificates");
  };

  const handleReject = () => {
    if (confirm("❌ Are you sure you want to reject this certificate?")) {
      alert("Certificate Rejected (mock).");
      // TODO: Send reject request to backend
      router.push("/dashboard/admin/certificates");
    }
  };

  const handleDownload = () => {
    alert("🚀 Downloading certificate (mock)!");
    // TODO: Open/download certificate PDF from backend
    window.open(certificate.certificateUrl, "_blank");
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
