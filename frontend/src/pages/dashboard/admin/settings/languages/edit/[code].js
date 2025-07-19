// pages/dashboard/admin/settings/languages/edit/[code].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getLanguages, updateLanguage } from "@/services/languageService";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { FaArrowLeft, FaSave, FaUpload } from "react-icons/fa";

const fetchTranslations = async (code) => {
  const data = {};
  for (const ns of namespaces) {
    const res = await fetch(`/api/translations/${code}/${ns}`);
    if (res.ok) data[ns] = await res.json();
    else data[ns] = {};
  }
  return data;
};

const namespaces = ["common", "website", "dashboard", "auth"];

export default function EditLanguagePage() {
  const router = useRouter();
  const { code } = router.query;
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(false); // UI-only mode
  const [error, setError] = useState("");
  const [language, setLanguage] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [iconUploading, setIconUploading] = useState(false);
  const [newKeys, setNewKeys] = useState({});

  useEffect(() => {
    if (!code) return;
    const load = async () => {
      setLoading(true);
      try {
        const langs = await getLanguages();
        const lang = langs.find((l) => l.code === code);
        setLanguage(lang);
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

  const handleAddKey = (ns) => {
    const { key, value } = newKeys[ns] || {};
    if (!key) return;
    setTranslations((prev) => ({
      ...prev,
      [ns]: { ...prev[ns], [key]: value || "" },
    }));
    setNewKeys((prev) => ({ ...prev, [ns]: { key: "", value: "" } }));
  };

  const handleDeleteKey = (ns, key) => {
    setTranslations((prev) => {
      const { [key]: _removed, ...rest } = prev[ns] || {};
      return { ...prev, [ns]: rest };
    });
  };

const handleIconChange = (file) => {
  if (file && file.type.startsWith("image/")) {
    setIconFile(file);
  }
};

  const handleIconUpload = async () => {
    if (!language?.id || !iconFile) return;
    setIconUploading(true);
    try {
      const fd = new FormData();
      fd.append("icon", iconFile);
      const updated = await updateLanguage(language.id, fd);
      setLanguage(updated);
      setIconFile(null);
      alert("Icon uploaded");
    } catch (err) {
      console.error(err);
      alert("Failed to upload icon");
    } finally {
      setIconUploading(false);
    }
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
            {language && (
              <div className="bg-white shadow rounded p-4">
                <label className="block font-semibold mb-1">Language Icon</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleIconChange(e.target.files[0])}
                  className="border p-2 rounded w-full"
                />
                {(iconFile || language.icon_url) && (
                  <img
                    src={iconFile ? URL.createObjectURL(iconFile) : `${process.env.NEXT_PUBLIC_API_BASE_URL}${language.icon_url}`}
                    alt="icon preview"
                    className="mt-2 w-6 h-6 rounded"
                  />
                )}
                <button
                  type="button"
                  onClick={handleIconUpload}
                  disabled={iconUploading || !iconFile}
                  className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1 disabled:opacity-50"
                >
                  <FaUpload /> {iconUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            )}
            {namespaces.map((ns) => (
              <div key={ns} className="bg-white shadow rounded p-4">
                <h2 className="text-lg font-semibold mb-4">🗂️ {ns}.json</h2>
                {Object.entries(translations[ns] || {}).map(([key, val]) => (
                  <div key={key} className="mb-3 flex items-center gap-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 w-1/3">{key}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => handleChange(ns, key, e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteKey(ns, key)}
                      className="text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {Object.keys(translations[ns] || {}).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No keys found in this namespace.</p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Key"
                    value={newKeys[ns]?.key || ""}
                    onChange={(e) =>
                      setNewKeys((prev) => ({
                        ...prev,
                        [ns]: { ...(prev[ns] || {}), key: e.target.value },
                      }))
                    }
                    className="border p-2 rounded w-1/3"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={newKeys[ns]?.value || ""}
                    onChange={(e) =>
                      setNewKeys((prev) => ({
                        ...prev,
                        [ns]: { ...(prev[ns] || {}), value: e.target.value },
                      }))
                    }
                    className="border p-2 rounded w-full"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddKey(ns)}
                    className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Add
                  </button>
                </div>
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
