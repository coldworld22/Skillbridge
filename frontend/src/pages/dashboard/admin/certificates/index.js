// pages/dashboard/admin/certificates/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSearch, FaSync, FaEye, FaDownload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Mock data (later replace with fetch from backend)
    setCertificates([
      {
        id: 'c1',
        studentName: 'Sara Ali',
        className: 'React & Next.js Bootcamp',
        issueDate: '2025-05-30T10:00:00Z',
        status: 'Issued'
      },
      {
        id: 'c2',
        studentName: 'Mohammed Saleh',
        className: 'UI/UX Design Basics',
        issueDate: '2025-06-05T14:00:00Z',
        status: 'Pending'
      }
    ]);
  }, []);

  const filteredCertificates = certificates.filter(c => {
    const matchesSearch = c.studentName.toLowerCase().includes(search.toLowerCase()) ||
                           c.className.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">🎓 Manage Certificates</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder="Search student or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 border rounded bg-gray-100"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border rounded bg-gray-100"
          >
            <option value="all">All Status</option>
            <option value="issued">Issued</option>
            <option value="pending">Pending</option>
            <option value="revoked">Revoked</option>
          </select>

          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 flex items-center gap-2"
          >
            <FaSync /> Refresh
          </button>
        </div>

        {/* Certificates Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Class</th>
                <th className="p-3 text-left">Issue Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCertificates.map(c => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">{c.studentName}</td>
                  <td className="p-3">{c.className}</td>
                  <td className="p-3">{new Date(c.issueDate).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      c.status === 'Issued' ? 'bg-green-100 text-green-700' :
                      c.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <Link href={`/dashboard/admin/certificates/view/${c.id}`} className="text-blue-600 hover:text-blue-800">
                      <FaEye />
                    </Link>
                    {c.status === 'Issued' && (
                      <button
                        onClick={() => alert('🚀 Downloading certificate (mock)!')}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FaDownload />
                      </button>
                    )}
                    {c.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => alert('✅ Approving certificate (mock)!')}
                          className="text-green-600 hover:text-green-800"
                        >
                          <FaCheckCircle />
                        </button>
                        <button
                          onClick={() => alert('❌ Rejecting certificate (mock)!')}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimesCircle />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCertificates.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center p-6 text-gray-400">
                    No certificates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
