// pages/dashboard/instructor/certificates/index.js
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import Link from "next/link";
import { FaEye, FaTrashAlt } from "react-icons/fa";

export default function InstructorCertificatesPage() {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    // Mock certificates
    setCertificates([
      {
        id: "c1",
        studentName: "Ahmed Mohamed",
        courseTitle: "React & Next.js Bootcamp",
        issueDate: "2025-05-01",
        status: "Issued",
      },
      {
        id: "c2",
        studentName: "Sara Ali",
        courseTitle: "UI/UX Design Basics",
        issueDate: "2025-05-03",
        status: "Issued",
      },
    ]);
  }, []);

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this certificate?")) {
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      alert("🗑️ Certificate deleted (mock)!");
    }
  };

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-8">🎓 My Issued Certificates</h1>

        {certificates.length === 0 ? (
          <p className="text-center text-gray-500">No certificates issued yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Course</th>
                  <th className="p-3 text-left">Issued On</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id} className="border-t">
                    <td className="p-3">{cert.studentName}</td>
                    <td className="p-3">{cert.courseTitle}</td>
                    <td className="p-3">{new Date(cert.issueDate).toLocaleDateString()}</td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                        {cert.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <Link
                        href={`/dashboard/instructor/certificates/preview/${cert.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEye />
                      </Link>
                      <button
                        onClick={() => handleDelete(cert.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </InstructorLayout>
  );
}
