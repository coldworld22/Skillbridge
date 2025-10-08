// ─────────────────────────────────────
// 📁 dashboard/admin/certificates/index.js
// ─────────────────────────────────────
import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSearch, FaSync, FaEye, FaDownload, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import {
  fetchAllCertificates,
  approveCertificate,
  rejectCertificate,
  downloadCertificate,
} from "@/services/admin/certificateService";

export default function AdminCertificatesPage() {
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'adminCertificatesPage' });

  const [certificates, setCertificates] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAllCertificates(page, limit);
        setCertificates(data);
        setHasMore(data.length === limit);
      } catch (err) {
        console.error('Failed to load certificates', err);
        setError('Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [page]);

  const filteredCertificates = certificates.filter(c => {
    const matchesSearch = c.studentName.toLowerCase().includes(search.toLowerCase()) ||
                           c.className.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (c.status && c.status.toLowerCase() === filterStatus);
    return matchesSearch && matchesStatus;
  });

  const handleDownload = async (cert) => {
    try {
      const blob = await downloadCertificate(cert.id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${cert.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Download failed');
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveCertificate(id);
      setCertificates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'Issued' } : c))
      );
    } catch (err) {
      alert('Approve failed');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectCertificate(id);
      setCertificates((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'Revoked' } : c))
      );
    } catch (err) {
      alert('Reject failed');
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900" dir={i18n.dir()}>
        <h1 className="text-2xl font-bold text-yellow-500 mb-6">🎓 {t('title')}</h1>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 p-2 border rounded bg-gray-100"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border rounded bg-gray-100"
          >
            <option value="all">{t('all_status')}</option>
            <option value="issued">{t('issued')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="revoked">{t('revoked')}</option>
          </select>

          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600 flex items-center gap-2"
          >
            <FaSync /> {t('refresh')}
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
                      c.status && c.status === 'Issued'
                        ? 'bg-green-100 text-green-700'
                        : c.status && c.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {c.status || ''}
                    </span>
                  </td>
                  <td className="p-3 flex gap-2">
                    <Link href={`/dashboard/admin/certificates/view/${c.id}`} className="text-blue-600 hover:text-blue-800">
                      <FaEye />
                    </Link>
                    {c.status && c.status === 'Issued' && (
                      <button
                        onClick={() => handleDownload(c)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <FaDownload />
                      </button>
                    )}
                    {c.status && c.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(c.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <FaCheckCircle />
                        </button>
                        <button
                          onClick={() => handleReject(c.id)}
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
                    {t('no_certificates')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
