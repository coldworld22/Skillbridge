import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  createTenantDomain,
  deleteTenantDomain,
  fetchTenantDomains,
  verifyTenantDomain,
} from "@/services/admin/tenantDomainsService";
import { toast } from "react-toastify";
import { FaCheckCircle, FaCopy, FaPlus, FaTrash } from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import styles from "../settings.module.scss";

const statusStyles = {
  verified: styles.badgeSuccess,
  pending: styles.badgeWarning,
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export default function TenantDomainsSettingsPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "tenantDomainsPage",
  });
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [alert, setAlert] = useState(null);
  const [actionState, setActionState] = useState({});

  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTenantDomains();
      setDomains(Array.isArray(data) ? data : []);
      setAlert(null);
    } catch (error) {
      const message = getErrorMessage(error, t("load_failed"));
      setAlert({ type: "error", message });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadDomains();
  }, [loadDomains]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!domainInput.trim()) {
      toast.error(t("domain_required"));
      return;
    }
    setSaving(true);
    try {
      const created = await createTenantDomain({ domain: domainInput });
      setDomainInput("");
      setDomains((prev) => [...prev, created]);
      setAlert(null);
      toast.success(t("create_success"));
    } catch (error) {
      const message = getErrorMessage(error, t("create_failed"));
      setAlert({ type: "error", message });
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const setActionLoading = (id, updates) => {
    setActionState((prev) => ({
      ...prev,
      [id]: {
        verify: prev[id]?.verify ?? false,
        delete: prev[id]?.delete ?? false,
        ...updates,
      },
    }));
  };

  const handleVerify = async (domain) => {
    setActionLoading(domain.id, { verify: true });
    try {
      await verifyTenantDomain(domain.id, {
        token: domain.verification_token,
      });
      toast.success(t("verify_success"));
      setAlert(null);
      await loadDomains();
    } catch (error) {
      const message = getErrorMessage(error, t("verify_failed"));
      setAlert({ type: "error", message });
      toast.error(message);
    } finally {
      setActionLoading(domain.id, { verify: false });
    }
  };

  const handleDelete = async (domain) => {
    setActionLoading(domain.id, { delete: true });
    try {
      await deleteTenantDomain(domain.id);
      toast.success(t("delete_success"));
      setDomains((prev) => prev.filter((item) => item.id !== domain.id));
      setAlert(null);
    } catch (error) {
      const message = getErrorMessage(error, t("delete_failed"));
      setAlert({ type: "error", message });
      toast.error(message);
    } finally {
      setActionLoading(domain.id, { delete: false });
    }
  };

  const handleCopy = async (token) => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success(t("copy_success"));
    } catch (error) {
      const message = getErrorMessage(error, t("copy_failed"));
      toast.error(message);
    }
  };

  const pendingDomains = useMemo(
    () => domains.filter((domain) => domain.status !== "verified"),
    [domains]
  );

  return (
    <AdminLayout title={t("title")}>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🌐 {t("title")}</h1>
            <p className={styles.subtitle}>{t("subtitle")}</p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.noticeCard}`}>
          <p>{t("instructions_title")}</p>
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
            <li>{t("instructions_step_1")}</li>
            <li>{t("instructions_step_2")}</li>
            <li>{t("instructions_step_3")}</li>
          </ul>
        </div>

        {alert?.type === "error" && (
          <div className={`${styles.card} ${styles.errorCard}`}>
            {alert.message}
          </div>
        )}

        <form className={styles.form} onSubmit={handleCreate}>
          <div className={styles.field}>
            <label className={styles.label}>{t("domain_label")}</label>
            <input
              type="text"
              className={styles.input}
              placeholder={t("domain_placeholder")}
              value={domainInput}
              onChange={(event) => setDomainInput(event.target.value)}
              disabled={saving}
            />
          </div>
          <div className={styles.actionsRight}>
            <button
              type="submit"
              className={styles.buttonPrimary}
              disabled={saving}
            >
              <FaPlus /> {saving ? t("creating") : t("add_domain")}
            </button>
          </div>
        </form>

        {loading ? (
          <div className={styles.card} style={{ textAlign: "center" }}>
            {t("loading")}
          </div>
        ) : domains.length === 0 ? (
          <div className={styles.card} style={{ textAlign: "center" }}>
            <h2 className={styles.cardTitle}>{t("empty_title")}</h2>
            <p className={styles.mutedText}>{t("empty_description")}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>{t("table_domain")}</th>
                  <th className={styles.th}>{t("table_status")}</th>
                  <th className={styles.th}>{t("table_token")}</th>
                  <th className={styles.th}>{t("table_actions")}</th>
                </tr>
              </thead>
              <tbody>
                {domains.map((domain) => (
                  <tr key={domain.id} className={styles.row}>
                    <td className={styles.td}>{domain.domain}</td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.statusBadge} ${
                          statusStyles[domain.status] || styles.badgeDefault
                        }`}
                      >
                        {t(`status_${domain.status}`)}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {domain.verification_token ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <span style={{ fontFamily: "monospace" }}>
                            {domain.verification_token}
                          </span>
                          <button
                            type="button"
                            className={styles.linkButton}
                            onClick={() => handleCopy(domain.verification_token)}
                          >
                            <FaCopy /> {t("copy_token")}
                          </button>
                          {domain.status !== "verified" && (
                            <span className={styles.mutedText}>
                              {t("token_help")}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={styles.mutedText}>—</span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        {domain.status !== "verified" && (
                          <button
                            type="button"
                            className={styles.buttonSecondary}
                            onClick={() => handleVerify(domain)}
                            disabled={actionState[domain.id]?.verify}
                          >
                            <FaCheckCircle />
                            {actionState[domain.id]?.verify
                              ? t("verifying")
                              : t("verify")}
                          </button>
                        )}
                        <button
                          type="button"
                          className={styles.buttonDanger}
                          onClick={() => handleDelete(domain)}
                          disabled={actionState[domain.id]?.delete}
                        >
                          <FaTrash />
                          {actionState[domain.id]?.delete
                            ? t("deleting")
                            : t("delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pendingDomains.length > 0 && (
          <div className={styles.card} style={{ marginTop: "1rem" }}>
            <h2 className={styles.cardTitle}>{t("pending_title")}</h2>
            <p className={styles.mutedText}>{t("pending_description")}</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
