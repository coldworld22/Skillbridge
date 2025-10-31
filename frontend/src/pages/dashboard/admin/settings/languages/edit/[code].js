import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getLanguages, updateLanguage } from "@/services/languageService";
import { toast } from "react-toastify";
import { mutate as mutateGlobal } from "swr";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { FaArrowLeft, FaDownload, FaSave, FaUpload } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../../next-i18next.config.js";
import withAuthProtection from "@/hooks/withAuthProtection";
import usePermission from "@/hooks/usePermission";

const namespaces = ["common", "website", "dashboard", "auth"];

const fetchTranslations = async (code) => {
  const data = {};
  for (const ns of namespaces) {
    try {
      const res = await fetch(`/api/translations/${code}/${ns}`);
      if (!res.ok) {
        data[ns] = {};
        continue;
      }
      const json = await res.json();
      data[ns] = json && typeof json === "object" && !Array.isArray(json) ? json : {};
    } catch (err) {
      console.error(`[languages] failed to fetch namespace ${ns} for ${code}`, err);
      data[ns] = {};
    }
  }
  return data;
};

const sortObjectKeys = (obj) => {
  const source = obj || {};
  return Object.keys(source)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = source[key];
      return acc;
    }, {});
};

function EditLanguagePage() {
  const router = useRouter();
  const rawCode = router.query.code;
  const currentCode = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "languagesPage" });
  const { requirePermission } = usePermission();
  const noPermissionMessage = t("no_permission", {
    defaultValue: "You do not have permission to manage languages.",
  });
  const ensureCanManage = () => requirePermission("manage_languages", noPermissionMessage);

  const [language, setLanguage] = useState(null);
  const [langForm, setLangForm] = useState({
    name: "",
    code: "",
    is_default: false,
    is_active: true,
  });
  const [initialCode, setInitialCode] = useState("");
  const [translations, setTranslations] = useState({});
  const [newKeys, setNewKeys] = useState({});
  const [importErrors, setImportErrors] = useState({});
  const [expandedNamespaces, setExpandedNamespaces] = useState(() =>
    namespaces.reduce((acc, ns) => ({ ...acc, [ns]: true }), {})
  );
  const [globalSearch, setGlobalSearch] = useState("");
  const [isFetching, setIsFetching] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [pageError, setPageError] = useState("");
  const [iconFile, setIconFile] = useState(null);
  const [iconUploading, setIconUploading] = useState(false);

  const normalizedSearch = useMemo(
    () => globalSearch.trim().toLowerCase(),
    [globalSearch]
  );

  const resetNamespaceState = useCallback(() => {
    setExpandedNamespaces(
      namespaces.reduce((acc, ns) => ({ ...acc, [ns]: true }), {})
    );
    setNewKeys({});
    setImportErrors({});
    setGlobalSearch("");
    setDirty(false);
  }, []);

  const loadLanguage = useCallback(
    async (targetCode) => {
      if (!targetCode) return;
      setIsFetching(true);
      setPageError("");
      try {
        const langs = await getLanguages();
        const lang =
          langs.find(
            (l) => l.code && l.code.toLowerCase() === targetCode.toLowerCase()
          ) || null;
        if (!lang) {
          setLanguage(null);
          setTranslations({});
          setPageError(
            t("language_not_found", { defaultValue: "Language not found." })
          );
          return;
        }
        setLanguage(lang);
        setLangForm({
          name: lang.name || "",
          code: lang.code || "",
          is_default: Boolean(lang.is_default),
          is_active: Boolean(lang.is_active),
        });
        setInitialCode(lang.code || "");
        const data = await fetchTranslations(lang.code);
        setTranslations(data);
        resetNamespaceState();
        setPageError("");
        setIconFile(null);
      } catch (err) {
        console.error(err);
        setPageError(t("load_failed", { defaultValue: "Failed to load translations." }));
      } finally {
        setIsFetching(false);
      }
    },
    [resetNamespaceState, t]
  );

  useEffect(() => {
    if (!router.isReady || !currentCode) return;
    loadLanguage(currentCode);
  }, [router.isReady, currentCode, loadLanguage]);

  const handleLangFormChange = (e) => {
    if (!ensureCanManage()) return;
    const { name, type, value, checked } = e.target;
    setLangForm((prev) => {
      const next = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      if (name === "is_default" && type === "checkbox" && checked) {
        next.is_active = true;
      }
      return next;
    });
    setDirty(true);
  };

  const handleTranslationChange = (ns, key, value) => {
    if (!ensureCanManage()) return;
    setTranslations((prev) => ({
      ...prev,
      [ns]: { ...(prev[ns] || {}), [key]: value },
    }));
    setDirty(true);
  };

  const handleAddKey = (ns) => {
    if (!ensureCanManage()) return;
    const entry = newKeys[ns] || {};
    const rawKey = entry.key || "";
    const trimmedKey = rawKey.trim();
    if (!trimmedKey) {
      toast.error(
        t("key_required", { defaultValue: "Translation key cannot be empty." })
      );
      return;
    }
    setTranslations((prev) => ({
      ...prev,
      [ns]: { ...(prev[ns] || {}), [trimmedKey]: entry.value || "" },
    }));
    setNewKeys((prev) => ({ ...prev, [ns]: { key: "", value: "" } }));
    setDirty(true);
  };

  const handleDeleteKey = (ns, key) => {
    if (!ensureCanManage()) return;
    const confirmed = confirm(
      t("confirm_delete_key", {
        defaultValue: "Remove key \"{{key}}\"?",
        key,
      })
    );
    if (!confirmed) return;
    setTranslations((prev) => {
      const nsEntries = { ...(prev[ns] || {}) };
      delete nsEntries[key];
      return { ...prev, [ns]: nsEntries };
    });
    setDirty(true);
  };

  const handleIconChange = (file) => {
    if (!ensureCanManage()) return;
    if (!file) return;
    if (
      !file.type.startsWith("image/") &&
      !/\.(png|jpe?g|svg|gif|webp)$/i.test(file.name || "")
    ) {
      toast.error(
        t("invalid_icon_file", { defaultValue: "Please choose an image file." })
      );
      return;
    }
    setIconFile(file);
  };

  const handleIconUpload = async () => {
    if (!ensureCanManage()) return;
    if (!language?.id || !iconFile) return;
    setIconUploading(true);
    try {
      const fd = new FormData();
      fd.append("icon", iconFile);
      const updated = await updateLanguage(language.id, fd);
      setLanguage(updated);
      setLangForm((prev) => ({
        ...prev,
        code: updated.code || prev.code,
      }));
      setIconFile(null);
      toast.success(t("icon_upload_success"));
      mutateGlobal("/languages");
    } catch (err) {
      console.error(err);
      toast.error(t("icon_upload_failed"));
    } finally {
      setIconUploading(false);
    }
  };

  const handleNamespaceUpload = (ns, file) => {
    if (!ensureCanManage()) return;
    if (!file) return;
    const isJson =
      file.type === "application/json" ||
      (file.name && file.name.toLowerCase().endsWith(".json"));
    if (!isJson) {
      toast.error(
        t("invalid_json", { defaultValue: "Only JSON translation files are supported." })
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Invalid JSON structure");
        }
        setTranslations((prev) => ({
          ...prev,
          [ns]: { ...(prev[ns] || {}), ...parsed },
        }));
        setImportErrors((prev) => ({ ...prev, [ns]: "" }));
        setDirty(true);
        toast.success(
          t("namespace_imported", {
            ns,
            defaultValue: "{{ns}} translations updated.",
          })
        );
      } catch (err) {
        console.error(err);
        const message =
          err?.message ||
          t("invalid_json", { defaultValue: "Invalid translation file." });
        setImportErrors((prev) => ({ ...prev, [ns]: message }));
        toast.error(
          t("invalid_json", { defaultValue: "Invalid translation file." })
        );
      }
    };
    reader.onerror = () => {
      setImportErrors((prev) => ({
        ...prev,
        [ns]: t("invalid_json", { defaultValue: "Invalid translation file." }),
      }));
      toast.error(
        t("invalid_json", { defaultValue: "Invalid translation file." })
      );
    };
    reader.readAsText(file);
  };

  const handleDownloadNamespace = (ns) => {
    const codeForFile = langForm.code || initialCode || currentCode || "language";
    const payload = sortObjectKeys(translations[ns] || {});
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${codeForFile}-${ns}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const toggleNamespace = (ns) => {
    setExpandedNamespaces((prev) => ({
      ...prev,
      [ns]: !prev[ns],
    }));
  };

  const validateForm = () => {
    const trimmedName = (langForm.name || "").trim();
    const trimmedCode = (langForm.code || "").trim();
    if (!trimmedName) {
      toast.error(
        t("language_name_required", { defaultValue: "Language name is required." })
      );
      return false;
    }
    if (!trimmedCode) {
      toast.error(
        t("language_code_required", { defaultValue: "Language code is required." })
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!ensureCanManage()) return;
    if (!language?.id || !validateForm()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: (langForm.name || "").trim(),
        code: (langForm.code || "").trim(),
        is_default: Boolean(langForm.is_default),
        is_active: Boolean(langForm.is_default ? true : langForm.is_active),
      };
      let updatedLanguage = language;
      if (language.id) {
        updatedLanguage = await updateLanguage(language.id, payload);
        setLanguage(updatedLanguage);
        setLangForm({
          name: updatedLanguage.name || "",
          code: updatedLanguage.code || "",
          is_default: Boolean(updatedLanguage.is_default),
          is_active: Boolean(updatedLanguage.is_active),
        });
        setInitialCode(updatedLanguage.code || payload.code);
      }

      const targetCode =
        (updatedLanguage?.code || payload.code || initialCode || currentCode || "").trim();
      if (!targetCode) {
        throw new Error("Missing language code");
      }

      const prepared = namespaces.reduce((acc, ns) => {
        acc[ns] = sortObjectKeys(translations[ns] || {});
        return acc;
      }, {});

      await Promise.all(
        namespaces.map(async (ns) => {
          const res = await fetch(`/api/translations/${targetCode}/${ns}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(prepared[ns]),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error || `Failed to save ${ns}.json`);
          }
        })
      );

      setTranslations(prepared);
      toast.success(t("language_updated"));
      mutateGlobal("/languages");
      setDirty(false);

      if (targetCode && targetCode !== currentCode) {
        router.replace(
          `/dashboard/admin/settings/languages/edit/${targetCode}`,
          undefined,
          { shallow: true }
        );
      }
    } catch (err) {
      console.error(err);
      const duplicate =
        err?.response?.data?.message &&
        err.response.data.message.toLowerCase().includes("duplicate");
      if (duplicate) {
        toast.error(
          t("language_exists", { defaultValue: "Language code already exists." })
        );
      } else {
        toast.error(
          err?.message || t("failed_to_save", { defaultValue: "Failed to save language." })
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderNamespaceCard = (ns) => {
    const entries = Object.entries(translations[ns] || {});
    const totalKeys = entries.length;
    const filtered = normalizedSearch
      ? entries.filter(([key, val]) => {
          const valueString =
            typeof val === "string"
              ? val
              : typeof val === "number"
              ? String(val)
              : JSON.stringify(val || "");
          return (
            key.toLowerCase().includes(normalizedSearch) ||
            valueString.toLowerCase().includes(normalizedSearch)
          );
        })
      : entries;
    const sorted = [...filtered].sort((a, b) => a[0].localeCompare(b[0]));
    const showNoMatches = normalizedSearch && totalKeys > 0 && sorted.length === 0;

    return (
      <div key={ns} className="bg-white shadow rounded p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span>🗂️ {ns}.json</span>
            <span className="text-xs font-medium text-gray-500">
              {t("keys_count", {
                count: totalKeys,
                defaultValue: "{{count}} keys",
              })}
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => toggleNamespace(ns)}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition"
            >
              {expandedNamespaces[ns]
                ? t("collapse", { defaultValue: "Collapse" })
                : t("expand", { defaultValue: "Expand" })}
            </button>
            <button
              type="button"
              onClick={() => handleDownloadNamespace(ns)}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition inline-flex items-center gap-2"
            >
              <FaDownload className="text-xs" />
              {t("download_json", { defaultValue: "Download JSON" })}
            </button>
            <label className="px-3 py-1 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition inline-flex items-center gap-2 cursor-pointer">
              <FaUpload className="text-xs" />
              {t("import_json", { defaultValue: "Import JSON" })}
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  handleNamespaceUpload(ns, file);
                  event.target.value = "";
                }}
              />
            </label>
          </div>
        </div>

        {importErrors[ns] && (
          <p className="text-sm text-red-600 mb-3">{importErrors[ns]}</p>
        )}

        {expandedNamespaces[ns] && (
          <>
            {sorted.map(([key, value]) => (
              <div key={key} className="mb-3 flex flex-col md:flex-row md:items-center md:gap-3">
                <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0 md:w-1/3 break-words">
                  {key}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleTranslationChange(ns, key, e.target.value)}
                  className="border p-2 rounded w-full"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteKey(ns, key)}
                  className="text-red-600 text-sm mt-2 md:mt-0"
                >
                  {t("delete")}
                </button>
              </div>
            ))}

            {showNoMatches && (
              <p className="text-sm text-gray-400 italic">
                {t("no_matches", {
                  defaultValue: "No translations match your search.",
                })}
              </p>
            )}

            {!showNoMatches && sorted.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                {t("no_keys_found")}
              </p>
            )}

            <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                placeholder={t("key")}
                value={newKeys[ns]?.key || ""}
                onChange={(e) =>
                  setNewKeys((prev) => ({
                    ...prev,
                    [ns]: { ...(prev[ns] || {}), key: e.target.value },
                  }))
                }
                className="border p-2 rounded w-full sm:w-1/3"
              />
              <input
                type="text"
                placeholder={t("value")}
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
                className="bg-blue-500 text-white px-3 py-2 rounded text-sm whitespace-nowrap"
              >
                {t("add")}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6" dir={i18n.dir()}>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            🌐 {t("edit_title", { code: langForm.code || currentCode })}
          </h1>
          <Link href="/dashboard/admin/settings/languages">
            <button className="flex items-center gap-2 text-gray-600 hover:text-black">
              <FaArrowLeft /> {t("back")}
            </button>
          </Link>
        </div>

        {pageError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{pageError}</span>
            <button
              onClick={() => loadLanguage(currentCode)}
              className="underline text-sm"
            >
              {t("retry", { defaultValue: "Retry" })}
            </button>
          </div>
        )}

        {isFetching ? (
          <div className="space-y-4">
            <div className="h-32 bg-gray-100 animate-pulse rounded" />
            <div className="h-48 bg-gray-100 animate-pulse rounded" />
            <div className="h-48 bg-gray-100 animate-pulse rounded" />
          </div>
        ) : language ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-8"
          >
            <div className="grid md:grid-cols-2 gap-6 bg-white shadow rounded p-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block font-semibold mb-1">
                    {t("language_name")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={langForm.name}
                    onChange={handleLangFormChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {t("language_code")}
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={langForm.code}
                    onChange={handleLangFormChange}
                    className="border p-2 rounded w-full"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_default"
                    checked={langForm.is_default}
                    onChange={handleLangFormChange}
                  />
                  <span className="text-sm">{t("set_as_default")}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={langForm.is_active}
                    onChange={handleLangFormChange}
                    disabled={langForm.is_default}
                  />
                  <span className="text-sm">
                    {langForm.is_default
                      ? t("default_always_active", {
                          defaultValue: "Default language is always active.",
                        })
                      : t("active")}
                  </span>
                </label>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {t("language_icon")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleIconChange(e.target.files?.[0] || null)}
                  className="border p-2 rounded w-full"
                />
                {(iconFile || language?.icon_url) && (
                  <img
                    src={
                      iconFile
                        ? URL.createObjectURL(iconFile)
                        : `${process.env.NEXT_PUBLIC_API_BASE_URL}${language?.icon_url}`
                    }
                    alt="icon preview"
                    className="mt-2 w-10 h-10 rounded object-cover border"
                  />
                )}
                <button
                  type="button"
                  onClick={handleIconUpload}
                  disabled={iconUploading || !iconFile || !language?.id}
                  className="mt-3 bg-green-500 text-white px-3 py-2 rounded text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <FaUpload className="text-xs" />
                  {iconUploading
                    ? t("uploading")
                    : t("upload")}
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <label className="block font-semibold mb-1">
                  {t("search_placeholder", {
                    defaultValue: "Search languages…",
                  })}
                </label>
                <p className="text-xs text-gray-500">
                  {t("search_hint", {
                    defaultValue: "Filter keys or values across all namespaces.",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="search"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder={t("search_keys", {
                    defaultValue: "Search translation keys…",
                  })}
                  className="border p-2 rounded w-full md:w-64"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch("")}
                    className="text-sm text-gray-600 underline"
                  >
                    {t("clear", { defaultValue: "Clear" })}
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-6">
              {namespaces.map((ns) => renderNamespaceCard(ns))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-sm text-gray-500">
                {dirty
                  ? t("unsaved_changes", {
                      defaultValue: "You have unsaved updates.",
                    })
                  : t("all_changes_saved", {
                      defaultValue: "All changes saved.",
                    })}
              </span>
              <button
                type="submit"
                disabled={isSaving || !dirty}
                className="bg-yellow-500 text-white px-6 py-2 rounded shadow flex items-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                {isSaving
                  ? t("saving", { defaultValue: "Saving…" })
                  : t("save_changes")}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </AdminLayout>
  );
}

const ProtectedEditLanguagePage = withAuthProtection(EditLanguagePage, {
  permissions: ["manage_languages"],
});

export default ProtectedEditLanguagePage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
