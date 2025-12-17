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
import styles from "../settings.module.scss";

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
      <div className={styles.page} dir={i18n.dir()}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t("title")}</h1>
          {canManage && (
            <div className={styles.filters}>
              <button
                onClick={goToConfig}
                className={styles.buttonSecondary}
              >
                <FaCog />{" "}
                {t("configure_defaults", { defaultValue: "Configure defaults" })}
              </button>
              <button
                onClick={goToCreate}
                className={styles.buttonPrimary}
              >
                + {t("add_language")}
              </button>
            </div>
          )}
        </div>

        <div className={styles.toolbar}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("search_placeholder", { defaultValue: "Search languages…" })}
            className={styles.input}
          />
          {languages && (
            <span className={styles.mutedText}>
              {t("showing_count", {
                defaultValue: "Showing {{filtered}} of {{total}} languages",
                filtered: filteredLanguages.length,
                total: languages.length,
              })}
            </span>
          )}
        </div>

        <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th}>{t("icon")}</th>
              <th className={styles.th}>{t("name")}</th>
              <th className={styles.th}>{t("code")}</th>
              <th className={styles.th} style={{ textAlign: "center" }}>{t("default")}</th>
              <th className={styles.th} style={{ textAlign: "center" }}>{t("active")}</th>
              <th className={styles.th}>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={6} className={styles.td} style={{ textAlign: "center" }}>
                  {t("load_failed", { defaultValue: "Failed to load languages." })}
                  <button
                    onClick={handleRetry}
                    className={`${styles.buttonSecondary} ${styles.textDanger}`}
                  >
                    {t("retry", { defaultValue: "Retry" })}
                  </button>
                </td>
              </tr>
            ) : isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className={styles.row}>
                  <td className={styles.td}>
                    <div className={styles.skeletonCircle} />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.skeletonLine} style={{ width: "96px" }} />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.skeletonLine} style={{ width: "64px" }} />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.skeletonLine} style={{ width: "48px" }} />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.skeletonLine} style={{ width: "48px" }} />
                  </td>
                  <td className={styles.td}>
                    <div className={styles.skeletonLine} style={{ width: "96px" }} />
                  </td>
                </tr>
              ))
            ) : filteredLanguages.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.td} style={{ textAlign: "center" }}>
                  {searchTerm
                    ? t("no_results", { defaultValue: "No languages match your search." })
                    : t("no_languages", { defaultValue: "No languages found yet." })}
                  {canManage && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <button
                        onClick={goToCreate}
                        className={styles.buttonPrimary}
                      >
                        + {t("add_language")}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginated.map((lang) => (
                <tr key={lang.id} className={styles.row}>
                  <td className={styles.td}>
                    {lang.icon_url && (
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${lang.icon_url}`}
                        alt="icon"
                        className={styles.previewImage}
                      />
                    )}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.inlineCard} style={{ gap: "0.4rem", padding: 0 }}>
                      <span>{lang.name}</span>
                      {lang.is_default && (
                        <span className={`${styles.statusBadge} ${styles.badgeInfo}`}>
                          {t("default_badge", { defaultValue: "Default" })}
                        </span>
                      )}
                      {!lang.is_active && (
                        <span className={`${styles.statusBadge} ${styles.badgeDefault}`}>
                          {t("inactive_badge", { defaultValue: "Inactive" })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={styles.td}>{lang.code}</td>
                  <td className={styles.td} style={{ textAlign: "center" }}>
                    <input
                      type="radio"
                      checked={lang.is_default}
                      disabled={!canManage}
                      onChange={() => setDefault(lang)}
                    />
                  </td>
                  <td className={styles.td} style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={lang.is_active}
                      disabled={!canManage}
                      onChange={() => toggleActive(lang)}
                    />
                  </td>
                  <td className={styles.td}>
                    {canManage ? (
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleEdit(lang.code)}
                          className={`${styles.buttonSecondary} ${styles.textInfo}`}
                        >
                          <FaEdit /> {t("edit")}
                        </button>
                        <button
                          onClick={() => remove(lang.id)}
                          className={`${styles.buttonSecondary} ${styles.textDanger}`}
                        >
                          <FaTrashAlt /> {t("delete")}
                        </button>
                      </div>
                    ) : (
                      <span className={styles.mutedText}>
                        {t("view_only", { defaultValue: "View only" })}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        {totalPages > 1 && filteredLanguages.length > 0 && (
          <div className={styles.pagination} style={{ justifyContent: "center" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={styles.pagerButton}
            >
              {t("prev")}
            </button>
            <span className={styles.mutedText}>
              {t("page_of", { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => setCurrentPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={currentPage >= totalPages}
              className={styles.pagerButton}
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

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
