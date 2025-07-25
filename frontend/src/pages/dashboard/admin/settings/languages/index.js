import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import useSWR from "swr";
import api from "@/services/api/api";
import { useRouter } from "next/router";
import { useState } from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";

const fetcher = url => api.get(url).then(res => res.data.data);

export default function LanguagesPage() {
  const router = useRouter();
  const { data: languages, mutate } = useSWR("/languages", fetcher);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const toggleActive = async (lang) => {
    await api.put(`/languages/${lang.id}`, { ...lang, is_active: !lang.is_active });
    mutate();
  };

  const setDefault = async (lang) => {
    await api.put(`/languages/${lang.id}`, { ...lang, is_default: true });
    mutate();
  };

  const remove = async (id) => {
    if (confirm("Delete language?")) {
      await api.delete(`/languages/${id}`);
      mutate();
    }
  };

  const totalPages = Math.ceil((languages?.length || 0) / ITEMS_PER_PAGE);
  const paginated = languages?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Languages</h1>
          <Link href="/dashboard/admin/settings/languages/create" className="bg-yellow-500 text-white px-4 py-2 rounded">+ Add Language</Link>
        </div>
        <table className="min-w-full bg-white border rounded">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Icon</th>

              <th className="p-3">Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Default</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated?.map((lang) => (
              <tr key={lang.id} className="border-t">
                <td className="p-3">
                  {lang.icon_url && (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${lang.icon_url}`}
                      alt="icon"
                      className="w-6 h-6 rounded"
                    />
                  )}
                </td>
                <td className="p-3">{lang.name}</td>
                <td className="p-3">{lang.code}</td>
                <td className="p-3 text-center">
                  <input type="radio" checked={lang.is_default} onChange={() => setDefault(lang)} />
                </td>
                <td className="p-3 text-center">
                  <input type="checkbox" checked={lang.is_active} onChange={() => toggleActive(lang)} />
                </td>
                <td className="p-3 space-x-2">
                  <button
                    onClick={() => router.push(`/dashboard/admin/settings/languages/edit/${lang.code}`)}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md transition text-sm"
                  >
                    <FaEdit className="text-xs" /> Edit
                  </button>
                  <button
                    onClick={() => remove(lang.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-red-500 text-red-600 hover:bg-red-50 rounded-md transition text-sm"
                  >
                    <FaTrashAlt className="text-xs" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex justify-center mt-4 gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => (p < totalPages ? p + 1 : p))
              }
              disabled={currentPage >= totalPages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
