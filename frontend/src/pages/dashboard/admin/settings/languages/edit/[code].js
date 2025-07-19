// pages/dashboard/admin/settings/languages/edit/[code].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { FaArrowLeft, FaSave } from "react-icons/fa";

const fetchTranslations = async (code) => {
  const data = {};
  for (const ns of namespaces) {
    const res = await fetch(`/api/translations/${code}/${ns}`);
    if (res.ok) data[ns] = await res.json();
    else data[ns] = {};
  }
  return data;
};

const namespaces = ["common", "website", "dashboard", "auth", "classes"];

export default function EditLanguagePage() {
  const router = useRouter();
  const { code } = router.query;
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false); // UI-only mode
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchTranslations(code);
        setTranslations(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load translations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  const handleChange = (ns, key, value) => {
    setTranslations((prev) => ({
      ...prev,
      [ns]: { ...prev[ns], [key]: value },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      for (const ns of namespaces) {
        await fetch(`/api/translations/${code}/${ns}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(translations[ns] || {}),
        });
      }
      alert("Translations saved");
    } catch (err) {
      console.error(err);
      alert("Failed to save translations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">🌐 Edit Language: {code}</h1>
          <Link href="/dashboard/admin/settings/languages">
            <button className="flex items-center gap-2 text-gray-600 hover:text-black">
              <FaArrowLeft /> Back
            </button>
          </Link>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-8"
          >
            {namespaces.map((ns) => (
              <div key={ns} className="bg-white shadow rounded p-4">
                <h2 className="text-lg font-semibold mb-4">🗂️ {ns}.json</h2>
                {Object.entries(translations[ns] || {}).map(([key, val]) => (
                  <div key={key} className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{key}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleChange(ns, key, e.target.value)}
                      className="w-full border p-2 rounded"
                    />
                  </div>
                ))}
                {Object.keys(translations[ns] || {}).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No keys found in this namespace.</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="bg-yellow-500 text-white px-6 py-2 rounded shadow flex items-center gap-2"
            >
              <FaSave /> Save Changes
            </button>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}
