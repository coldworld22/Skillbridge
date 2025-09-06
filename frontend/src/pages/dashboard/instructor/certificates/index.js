// pages/dashboard/instructor/certificates/index.js
import { useEffect, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import Link from "next/link";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import {
  fetchCertificates,
  deleteCertificate,
} from "@/services/instructor/certificateService";

export default function InstructorCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchCertificates();
        setCertificates(data);
      } catch (err) {
        console.error('Failed to load certificates', err);
        setError('Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    try {
      await deleteCertificate(id);
      setCertificates((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-8">🎓 My Issued Certificates</h1>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && certificates.length === 0 ? (
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
