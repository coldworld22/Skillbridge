// pages/dashboard/admin/settings/languages/index.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Globe,
  Star,
  Pencil,
  Upload,
  Trash,
  ArrowLeftRight,
} from "lucide-react";

const mockLanguages = [
  {
    id: 1,
    label: "English",
    code: "en",
    direction: "ltr",
    active: true,
    default: true,
    translationProgress: 100,
  },
  {
    id: 2,
    label: "Arabic",
    code: "ar",
    direction: "rtl",
    active: true,
    default: false,
    translationProgress: 90,
  },
  {
    id: 3,
    label: "French",
    code: "fr",
    direction: "ltr",
    active: false,
    default: false,
    translationProgress: 70,
  },
];

export default function LanguageManagerPage() {
  const [languages, setLanguages] = useState(mockLanguages);

  const toggleActive = (id) => {
    setLanguages((prev) =>
      prev.map((lang) =>
        lang.id === id ? { ...lang, active: !lang.active } : lang
      )
    );
  };

  const setDefault = (id) => {
    setLanguages((prev) =>
      prev.map((lang) => ({
        ...lang,
        default: lang.id === id,
      }))
    );
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" /> Language Manager
          </h1>
          <button className="bg-yellow-500 text-white px-4 py-2 rounded shadow">
            + Add Language
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded shadow text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Language</th>
                <th className="p-3">Code</th>
                <th className="p-3 text-center">Direction</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Default</th>
                <th className="p-3">Progress</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {languages.map((lang) => (
                <tr key={lang.id} className="border-t">
                  <td className="p-3">{lang.label}</td>
                  <td className="p-3">{lang.code}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        lang.direction === "rtl"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {lang.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleActive(lang.id)}
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        lang.active
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {lang.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => setDefault(lang.id)}
                      title="Set as default"
                    >
                      <Star
                        className={`w-5 h-5 mx-auto ${
                          lang.default ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${lang.translationProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-right mt-1">{lang.translationProgress}%</div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button title="Edit" className="text-blue-600">
                        <Pencil size={16} />
                      </button>
                      <button title="Upload" className="text-green-600">
                        <Upload size={16} />
                      </button>
                      <button title="Delete" className="text-red-600">
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
