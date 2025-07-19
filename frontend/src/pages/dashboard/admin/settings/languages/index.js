import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import useSWR from "swr";
import api from "@/services/api/api";
import { useRouter } from "next/router";

const fetcher = url => api.get(url).then(res => res.data.data);

export default function LanguagesPage() {
  const router = useRouter();
  const { data: languages, mutate } = useSWR("/languages", fetcher);

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
              <th className="p-3">Name</th>
              <th className="p-3">Code</th>
              <th className="p-3">Default</th>
              <th className="p-3">Active</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {languages?.map((lang) => (
              <tr key={lang.id} className="border-t">
                <td className="p-3">{lang.name}</td>
                <td className="p-3">{lang.code}</td>
                <td className="p-3 text-center">
                  <input type="radio" checked={lang.is_default} onChange={() => setDefault(lang)} />
                </td>
                <td className="p-3 text-center">
                  <input type="checkbox" checked={lang.is_active} onChange={() => toggleActive(lang)} />
                </td>
                <td className="p-3 space-x-2">
                  <button onClick={() => router.push(`/dashboard/admin/settings/languages/edit/${lang.code}`)} className="text-blue-600">Edit</button>
                  <button onClick={() => remove(lang.id)} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
