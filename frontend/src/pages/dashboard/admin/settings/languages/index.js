import AdminLayout from "@/components/layouts/AdminLayout";
import useSWR, { mutate as mutateGlobal } from "swr";
import api from "@/services/api/api";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { FaCog, FaEdit, FaTrashAlt } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { toast } from "react-toastify";
import withAuthProtection from "@/hooks/withAuthProtection";
import usePermission from "@/hooks/usePermission";

const fetcher = (url) => api.get(url).then((res) => res.data.data);

function LanguagesPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation("dashboard", { keyPrefix: "languagesPage" });
  const { data: languages, mutate, error } = useSWR("/languages", fetcher);
  const isLoading = !languages && !error;
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const ITEMS_PER_PAGE = 5;
  const { can, requirePermission } = usePermission();
  const canManage = can("manage_languages");
  const noPermissionMessage = t("no_permission", {
    defaultValue: "You do not have permission to manage languages.",
  });

  const toggleActive = async (lang) => {
    if (!requirePermission("manage_languages", noPermissionMessage)) {
      return;
    }
    try {
      await api.put(`/languages/${lang.id}`, { is_active: !lang.is_active });
      mutate();
      mutateGlobal("/app-config");
      toast.success(t("language_updated"));
    } catch (err) {
      toast.error(t("failed_to_save"));
    }
  };

  const setDefault = async (lang) => {
    if (!requirePermission("manage_languages", noPermissionMessage)) {
      return;
    }
    if (lang.is_default) {
      return;
    }
    try {
      await api.put(`/languages/${lang.id}`, { is_default: true, is_active: true });
      mutate();
      mutateGlobal("/app-config");
      toast.success(t("language_updated"));
    } catch (err) {
      toast.error(t("failed_to_save"));
    }
  };

  const remove = async (id) => {
    if (!requirePermission("manage_languages", noPermissionMessage)) {
      return;
    }
    if (!confirm(t("confirm_delete"))) {
      return;
    }
    try {
      await api.delete(`/languages/${id}`);
      mutate();
      mutateGlobal("/app-config");
      toast.success(t("language_updated"));
    } catch (err) {
      toast.error(t("failed_to_save"));
    }
  };

  const goToCreate = () => {
    if (!requirePermission("manage_languages", noPermissionMessage)) {
      return;
    }
    router.push("/dashboard/admin/settings/languages/create");
  };

  const goToConfig = () => {
    router.push("/dashboard/admin/settings/language-config");
  };

  const handleEdit = (code) => {
    if (!canManage) {
      toast.error(noPermissionMessage);
      return;
    }
    router.push(`/dashboard/admin/settings/languages/edit/${code}`);
  };

  const filteredLanguages = useMemo(() => {
    if (!languages) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return languages;
    return languages.filter((lang) => {
      const name = lang.name?.toLowerCase() || "";
      const code = lang.code?.toLowerCase() || "";
      return name.includes(term) || code.includes(term);
    });
  }, [languages, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredLanguages.length / ITEMS_PER_PAGE));
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [filteredLanguages.length, currentPage]);

  const totalPages = Math.ceil((filteredLanguages.length || 0) / ITEMS_PER_PAGE);
  const paginated = filteredLanguages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleRetry = () => {
    mutate();
  };

  return (
    <AdminLayout>
      <div className="p-6" dir={i18n.dir()}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          {canManage && (
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={goToConfig}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-50 transition text-sm"
              >
                <FaCog className="text-xs" />{" "}
                {t("configure_defaults", { defaultValue: "Configure defaults" })}
              </button>
              <button
                onClick={goToCreate}
                className="bg-yellow-500 text-white px-4 py-2 rounded text-sm"
              >
                + {t("add_language")}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("search_placeholder", { defaultValue: "Search languages…" })}
            className="w-full sm:max-w-xs border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          {languages && (
            <span className="text-sm text-gray-600">
              {t("showing_count", {
                defaultValue: "Showing {{filtered}} of {{total}} languages",
                filtered: filteredLanguages.length,
                total: languages.length,
              })}
            </span>
          )}
        </div>

        <table className="min-w-full bg-white border rounded">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">{t("icon")}</th>
              <th className="p-3">{t("name")}</th>
              <th className="p-3">{t("code")}</th>
              <th className="p-3">{t("default")}</th>
              <th className="p-3">{t("active")}</th>
              <th className="p-3">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-red-600">
                  {t("load_failed", { defaultValue: "Failed to load languages." })}
                  <button
                    onClick={handleRetry}
                    className="ml-3 inline-flex items-center gap-1 px-3 py-1 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50 transition"
                  >
                    {t("retry", { defaultValue: "Retry" })}
                  </button>
                </td>
              </tr>
            ) : isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="border-t animate-pulse">
                  <td className="p-3">
                    <div className="w-6 h-6 bg-gray-200 rounded" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-12 mx-auto" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-12 mx-auto" />
                  </td>
                  <td className="p-3">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                  </td>
                </tr>
              ))
            ) : filteredLanguages.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  {searchTerm
                    ? t("no_results", { defaultValue: "No languages match your search." })
                    : t("no_languages", { defaultValue: "No languages found yet." })}
                  {canManage && (
                    <div className="mt-3">
                      <button
                        onClick={goToCreate}
                        className="bg-yellow-500 text-white px-4 py-2 rounded text-sm"
                      >
                        + {t("add_language")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginated.map((lang) => (
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
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span>{lang.name}</span>
                      {lang.is_default && (
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                          {t("default_badge", { defaultValue: "Default" })}
                        </span>
                      )}
                      {!lang.is_active && (
                        <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                          {t("inactive_badge", { defaultValue: "Inactive" })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">{lang.code}</td>
                  <td className="p-3 text-center">
                    <input
                      type="radio"
                      checked={lang.is_default}
                      disabled={!canManage}
                      onChange={() => setDefault(lang)}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={lang.is_active}
                      disabled={!canManage}
                      onChange={() => toggleActive(lang)}
                    />
                  </td>
                  <td className="p-3">
                    {canManage ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleEdit(lang.code)}
                          className="inline-flex items-center gap-1 px-2 py-1 border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-md transition text-sm"
                        >
                          <FaEdit className="text-xs" /> {t("edit")}
                        </button>
                        <button
                          onClick={() => remove(lang.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 border border-red-500 text-red-600 hover:bg-red-50 rounded-md transition text-sm"
                        >
                          <FaTrashAlt className="text-xs" /> {t("delete")}
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">
                        {t("view_only", { defaultValue: "View only" })}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && filteredLanguages.length > 0 && (
          <div className="flex justify-center mt-4 gap-3">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              {t("prev")}
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {t("page_of", { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => setCurrentPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
            >
              {t("next")}
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

const ProtectedLanguagesPage = withAuthProtection(LanguagesPage, {
  permissions: ["view_languages"],
});

export default ProtectedLanguagesPage;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
