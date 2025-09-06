// pages/dashboard/admin/certificates/edit/[id].js
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { getCertificate, updateCertificate } from "@/services/admin/certificateService";

export default function AdminEditCertificatePage() {
  const router = useRouter();
  const { id } = router.query;

  const [certificate, setCertificate] = useState(null);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    if (!certificate.studentName.trim() || !certificate.className.trim()) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateCertificate(id, certificate);
      router.push(`/dashboard/admin/certificates/view/${id}`);
    } catch (err) {
      console.error('Update failed', err);
      setError('Failed to save certificate');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-10 text-gray-500">Loading certificate...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!certificate) return null;

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">📝 Edit Certificate</h1>

          <div className="space-y-6 bg-gray-100 p-6 rounded-xl shadow-md">
            {/* Student Name */}
            <div>
              <label className="block mb-2 font-semibold">Student Name</label>
              <input
                type="text"
                value={certificate.studentName}
                onChange={(e) => setCertificate({ ...certificate, studentName: e.target.value })}
                className="w-full p-3 bg-gray-200 rounded"
              />
            </div>

            {/* Class Name */}
            <div>
              <label className="block mb-2 font-semibold">Class Name</label>
              <input
                type="text"
                value={certificate.className}
                onChange={(e) => setCertificate({ ...certificate, className: e.target.value })}
                className="w-full p-3 bg-gray-200 rounded"
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block mb-2 font-semibold">Issue Date</label>
              <input
                type="datetime-local"
                value={new Date(certificate.issueDate).toISOString().slice(0, 16)}
                onChange={(e) => setCertificate({ ...certificate, issueDate: new Date(e.target.value).toISOString() })}
                className="w-full p-3 bg-gray-200 rounded"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2 font-semibold">Status</label>
              <select
                value={certificate.status}
                onChange={(e) => setCertificate({ ...certificate, status: e.target.value })}
                className="w-full p-3 bg-gray-200 rounded"
              >
                <option value="Pending">Pending</option>
                <option value="Issued">Issued</option>
                <option value="Revoked">Revoked</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => router.push(`/dashboard/admin/certificates/view/${id}`)}
                className="w-full py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <FaArrowLeft /> Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaSave /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
