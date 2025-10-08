// pages/dashboard/admin/settings/languages/create.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { createLanguage, getLanguages } from "@/services/languageService";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

// Include the common namespace since it's used across the site
const predefinedNamespaces = ["common", "auth", "website", "dashboard"];

export default function CreateLanguagePage() {
  const router = useRouter();
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'languagesPage' });
  const [form, setForm] = useState({
    label: "",
    code: "",
    direction: "ltr",
    active: true,
    default: false,
    description: "",
    namespaceFiles: {},
    icon: null,
  });
  const [error, setError] = useState("");
  const [jsonPreviews, setJsonPreviews] = useState({});
  const [existingCodes, setExistingCodes] = useState([]);

  const handleFileUpload = (namespace, file) => {
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          if (typeof json !== "object" || Array.isArray(json)) throw new Error("Invalid JSON structure");
          setForm((prev) => ({
            ...prev,
            namespaceFiles: { ...prev.namespaceFiles, [namespace]: file },
          }));
          setJsonPreviews((prev) => ({ ...prev, [namespace]: json }));
          setError("");
        } catch (err) {
          setError(`Invalid JSON for ${namespace}. Must be a flat key-value object.`);
        }
      }; // <-- Close the onload function here
      reader.readAsText(file);
    } else {
      setError(`Only .json files allowed for ${namespace}.`);
    }
  };

  const handleIconChange = (file) => {
    if (file && file.type.startsWith("image/")) {
      setForm((prev) => ({ ...prev, icon: file }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  useEffect(() => {
    if (["ar", "he", "fa"].includes(form.code)) {
      setForm((prev) => ({ ...prev, direction: "rtl" }));
    } else {
      setForm((prev) => ({ ...prev, direction: "ltr" }));
    }
  }, [form.code]);

  // Load existing language codes to prevent duplicates
  useEffect(() => {
    const load = async () => {
      try {
        const langs = await getLanguages();
        setExistingCodes(langs.map((l) => l.code.toLowerCase()));
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (existingCodes.includes(form.code.toLowerCase())) {
      toast.error(t('language_exists'));
      return;
    }
    const fd = new FormData();
    fd.append("name", form.label);
    fd.append("code", form.code);
    fd.append("is_active", form.active);
    fd.append("is_default", form.default);
    if (form.icon) fd.append("icon", form.icon);
    try {
      await createLanguage(fd);
      for (const ns of predefinedNamespaces) {
        await fetch(`/api/translations/${form.code}/${ns}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(jsonPreviews[ns] || {}),
        });
      }
      toast.success(t('language_added'));
      router.push("/dashboard/admin/settings/languages");
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message?.toLowerCase().includes("duplicate")) {
        toast.error(t('language_exists'));
      } else {
        toast.error(t('failed_to_add'));
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto" dir={i18n.dir()}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">➕ {t('create_title')}</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-black"
          >
            <FaArrowLeft /> {t('back')}
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white p-6 shadow rounded md:grid md:grid-cols-2 md:gap-6 md:space-y-0"
        >
          <div>
          <label className="block font-semibold mb-1">{t('language_name')}</label>
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={handleChange}
              placeholder="e.g. Arabic"
              required
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
          <label className="block font-semibold mb-1">{t('language_code')}</label>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              placeholder="e.g. ar"
              required
              className="w-full border p-2 rounded"
            />
            {form.code && (
              <img
                src={`https://flagcdn.com/24x18/${form.code === 'en' ? 'gb' : form.code}.png`}
                alt="Flag preview"
                className="mt-2 w-6 h-4 rounded border"
              />
            )}
          </div>

          <div>
          <label className="block font-semibold mb-1">{t('language_icon')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleIconChange(e.target.files[0])}
              className="w-full border p-2 rounded"
            />
            {form.icon && (
              <img
                src={URL.createObjectURL(form.icon)}
                alt="icon preview"
                className="mt-2 w-6 h-6 rounded"
              />
            )}
          </div>

          <div>
          <label className="block font-semibold mb-1">{t('text_direction')}</label>
            <select
              name="direction"
              value={form.direction}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="ltr">{t('ltr_label')}</option>
              <option value="rtl">{t('rtl_label')}</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block font-semibold mb-1">{t('description_label')}</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              placeholder="Describe this language or its use context"
            />
          </div>

          <div className="col-span-2">
            <p className="font-semibold mb-2">{t('upload_translations')}</p>
            {predefinedNamespaces.map((ns) => (
              <div key={ns} className="mb-4">
                <label className="block font-medium mb-1 capitalize">{ns}.json</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => handleFileUpload(ns, e.target.files[0])}
                  className="w-full border p-2 rounded"
                />
                {jsonPreviews[ns] && (
                  <div className="bg-gray-100 text-xs p-2 mt-1 rounded">
                    <p className="font-bold mb-1">{t('preview_of', { ns })}:</p>
                    {Object.entries(jsonPreviews[ns]).slice(0, 5).map(([key, val]) => (
                      <div key={key} className="text-gray-800">
                        {key}: <span className="text-gray-600">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
          </div>

          <div className="flex items-center gap-4 col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              <span className="text-sm font-medium">{t('mark_as_active')}</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="default"
                checked={form.default}
                onChange={handleChange}
              />
              <span className="text-sm font-medium">{t('set_as_default')}</span>
            </label>
          </div>

          <button
            type="submit"
            className="bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2 col-span-2 justify-center"
          >
            <FaSave /> {t('save_language')}
          </button>
        </form>
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
