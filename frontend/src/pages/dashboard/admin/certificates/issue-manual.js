// pages/dashboard/admin/certificates/issue-manual.js
import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { useRouter } from "next/router";

export default function ManualCertificateIssuePage() {
  const router = useRouter();

  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 16)); // default to now
  const [status, setStatus] = useState("Issued");
  const [saving, setSaving] = useState(false);

  const handleSubmit = () => {
    if (!studentName.trim() || !className.trim()) {
      alert("⚠️ Please fill in all required fields.");
      return;
    }

    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      alert("✅ Certificate issued successfully (mock)!");
      router.push("/dashboard/admin/certificates");
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-500 mb-8">🎓 Issue Certificate Manually</h1>

          <div className="space-y-6 bg-gray-100 p-6 rounded-xl shadow-md">
            {/* Student Name */}
            <div>
              <label className="block mb-2 font-semibold">Student Name</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full p-3 bg-gray-200 rounded"
                placeholder="Enter student name..."
              />
            </div>

            {/* Class Name */}
            <div>
              <label className="block mb-2 font-semibold">Class Name</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full p-3 bg-gray-200 rounded"
                placeholder="Enter class name..."
              />
            </div>

            {/* Issue Date */}
            <div>
              <label className="block mb-2 font-semibold">Issue Date</label>
              <input
                type="datetime-local"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full p-3 bg-gray-200 rounded"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block mb-2 font-semibold">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-3 bg-gray-200 rounded"
              >
                <option value="Issued">Issued</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => router.push("/dashboard/admin/certificates")}
                className="w-full py-3 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <FaArrowLeft /> Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaSave /> {saving ? "Issuing..." : "Issue Certificate"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
