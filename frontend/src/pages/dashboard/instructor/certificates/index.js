// pages/dashboard/instructor/certificates/index.js
import { useEffect, useMemo, useState } from "react";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import Link from "next/link";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  fetchCertificates,
  deleteCertificate,
} from "@/services/instructor/certificateService";

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Issued", value: "issued" },
  { label: "Pending", value: "pending" },
  { label: "Revoked", value: "revoked" },
];

export default function InstructorCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (activeStatus !== "all") params.status = activeStatus;
        if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
        const data = await fetchCertificates(params);
        setCertificates(data);
      } catch (err) {
        console.error("Failed to load certificates", err);
        setError("Failed to load certificates. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeStatus, debouncedSearch]);

  useEffect(() => {
    const id = setTimeout(
      () => setDebouncedSearch(searchTerm),
      searchTerm ? 350 : 0,
    );
    return () => clearTimeout(id);
  }, [searchTerm]);

  const stats = useMemo(() => {
    const total = certificates.length;
    const issued = certificates.filter((c) => c.status === "issued").length;
    const pending = certificates.filter((c) => c.status === "pending").length;
    const revoked = certificates.filter((c) => c.status === "revoked").length;
    return { total, issued, pending, revoked };
  }, [certificates]);

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Revoke this certificate? Students will no longer see it on their profile.",
      )
    ) {
      return;
    }
    try {
      await deleteCertificate(id);
      toast.success("Certificate revoked.");
      setCertificates((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to revoke certificate", err);
      toast.error("Unable to revoke certificate. Please try again.");
    }
  };

  return (
    <InstructorLayout>
      <div className="min-h-screen px-6 py-10 bg-white text-gray-900">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-yellow-500">
              🎓 Certificates you&apos;ve issued
            </h1>
            <p className="text-sm text-gray-500">
              Track who received credentials and jump into previews instantly.
            </p>
          </div>
          <Link
            href="/dashboard/instructor/certificates/create"
            className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold"
          >
            + Issue certificate
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <SummaryCard label="Total issued" value={stats.total} accent="text-yellow-600" />
          <SummaryCard label="Active" value={stats.issued} accent="text-green-600" />
          <SummaryCard label="Pending" value={stats.pending} accent="text-blue-600" />
          <SummaryCard label="Revoked" value={stats.revoked} accent="text-red-600" />
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div className="inline-flex rounded-full bg-gray-100 p-1">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveStatus(filter.value)}
                className={`px-4 py-2 text-sm font-semibold rounded-full ${
                  activeStatus === filter.value
                    ? "bg-white shadow text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student, course or code"
              className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-full bg-gray-50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
              ⌕
            </span>
          </div>
        </div>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">{error}</div>
          ) : certificates.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No certificates found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500 bg-gray-50">
                    <th className="px-4 py-3 w-48">Student</th>
                    <th className="px-4 py-3 w-64">Course</th>
                    <th className="px-4 py-3 w-32">Issued</th>
                    <th className="px-4 py-3 w-32">Code</th>
                    <th className="px-4 py-3 w-28">Status</th>
                    <th className="px-4 py-3 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-800">
                          {cert.studentName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cert.grade ? `Grade: ${cert.grade}` : ""}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-800">
                          {cert.courseTitle || "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cert.classId}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-gray-600">
                        {cert.issueDate
                          ? new Date(cert.issueDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-4 text-gray-700 font-mono text-xs">
                        {cert.certificateCode}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={cert.status} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-3 text-base">
                          <Link
                            href={`/dashboard/instructor/certificates/preview/${cert.id}`}
                            className="text-blue-600 hover:text-blue-800"
                            title="Preview certificate"
                          >
                            <FaEye />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(cert.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Revoke certificate"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </InstructorLayout>
  );
}

const SummaryCard = ({ label, value, accent }) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4">
    <p className="text-xs uppercase tracking-widest text-gray-500">{label}</p>
    <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    issued: "bg-green-100 text-green-700",
    pending: "bg-blue-100 text-blue-700",
    revoked: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        map[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
};
