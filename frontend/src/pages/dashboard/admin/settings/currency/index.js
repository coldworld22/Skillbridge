// ─────────────────────
// Admin currency manager page.
// Lists currencies with pagination and allows editing.
// ─────────────────────
import AdminLayout from "@/components/layouts/AdminLayout";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useState, useMemo, useEffect } from "react";
import { toast } from "react-toastify";
import useAdminNotice from "@/hooks/useAdminNotice";
import Link from "next/link";
import useSWR from "swr";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

import withAuthProtection from "@/hooks/withAuthProtection";
import usePermission from "@/hooks/usePermission";
import {
  fetchCurrencies,
  updateCurrency,
  deleteCurrency as deleteCurrencyApi,
} from "@/services/admin/currencyService";
import { getAppConfig } from "@/services/appConfigService";
import { FaPlus, FaStar, FaSync, FaTrash, FaToggleOn, FaToggleOff, FaEdit } from "react-icons/fa";
import styles from "../settings.module.scss";

const fetcher = () => fetchCurrencies();
// React component: manage currencies with pagination
// ─────────────────────
function CurrencyManagerPage() {
  const { t, i18n } = useTranslation('dashboard', { keyPrefix: 'currenciesPage' });
  const { can, requirePermission } = usePermission();
  const canManage = can("manage_currencies");
  const manageWarning = t('no_permission', {
    defaultValue: 'You do not have permission to manage currencies.',
  });
  const {
    data: currencies = [],
    error,
    mutate,
  } = useSWR("/currencies", fetcher);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [rateModal, setRateModal] = useState({ isOpen: false, id: null, value: "" });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    cancelText: "",
    onConfirm: () => {},
  });
  const itemsPerPage = 10;
  const notify = useAdminNotice();

  const filteredCurrencies = useMemo(() => {
    return currencies.filter((c) => {
      const matchSearch =
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "active" && c.is_active) ||
        (filter === "inactive" && !c.is_active) ||
        (filter === "auto" && c.auto_update);
      return matchSearch && matchFilter;
    });
  }, [currencies, search, filter]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const pageCount = Math.ceil(filteredCurrencies.length / itemsPerPage) || 1;
  const startIndex = (page - 1) * itemsPerPage;

  const paginatedCurrencies = filteredCurrencies.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // ─────────────────────
  // Actions: toggle status, set default and update rates
  // ─────────────────────

  const toggleActive = async (id) => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    const currency = currencies.find((c) => c.id === id);
    if (!currency) return;
    try {
      await updateCurrency(id, { is_active: !currency.is_active });
      mutate();
      const status = currency.is_active ? t('inactive') : t('active');
      toast.success(t('status_updated'));
      const message = `Currency "${currency.label}" status changed to ${status}.`;
      notify("currency_status_changed", message);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || t('update_failed');
      toast.error(msg);
    }
  };

  const setDefault = async (id) => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    try {
      const currency = currencies.find((c) => c.id === id);
      await updateCurrency(id, { is_default: true });
      mutate();
      toast.success(t('set_default_success'));
      const message = `Currency "${currency?.label || id}" set as default.`;
      notify("currency_set_default", message);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || t('update_failed');
      toast.error(msg);
    }
  };

  const toggleAutoUpdate = async (id) => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    const currency = currencies.find((c) => c.id === id);
    if (!currency) return;
    try {
      await updateCurrency(id, { auto_update: !currency.auto_update });
      mutate();
      const status = currency.auto_update ? "disabled" : "enabled";
      toast.success(t('status_updated'));
      const message = `Currency "${currency.label}" auto update ${status}.`;
      notify("currency_auto_update_changed", message);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || t('update_failed');
      toast.error(msg);
    }
  };

  const refreshRate = async (id) => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    const currency = currencies.find((c) => c.id === id);
    if (!currency) return;
    try {
      let base = currencies.find((c) => c.is_default)?.code;
      if (!base) {
        const config = await getAppConfig().catch(() => ({}));
        base = config?.currency;
      }
      if (!base) throw new Error('Base currency not configured');

      const res = await fetch(
        `https://api.exchangerate.host/latest?base=${base}&symbols=${currency.code}`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      const rate = data?.rates?.[currency.code];
      if (!rate) throw new Error('Rate not found');

      await updateCurrency(id, {
        exchange_rate: rate,
        last_updated: new Date().toISOString(),
      });
      mutate();
      toast.success(t('rate_refreshed'));
      const message = `Currency "${currency.label}" rate refreshed.`;
      notify('currency_rate_refreshed', message);
    } catch (err) {
      console.error(err);
      const msg = err?.message ? `${t('failed_to_refresh')}: ${err.message}` : t('failed_to_refresh');
      toast.error(msg);
    }
  };

  const openRateModal = (currency) => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    setRateModal({ isOpen: true, id: currency.id, value: currency.exchange_rate, label: currency.label });
  };

  const closeRateModal = () => setRateModal({ isOpen: false, id: null, value: "" });

  const saveRate = async () => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    const value = parseFloat(rateModal.value);
    if (isNaN(value) || value <= 0) {
      toast.error(t('invalid_rate'));
      return;
    }
    try {
      await updateCurrency(rateModal.id, { exchange_rate: value });
      mutate();
      toast.success(t('rate_updated'));
      const currency = currencies.find((c) => c.id === rateModal.id);
      const message = `Currency "${currency?.label || rateModal.id}" rate set to ${value}.`;
      notify("currency_rate_updated", message);
      closeRateModal();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || t('update_failed');
      toast.error(msg);
    }
  };

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: t('delete'),
      cancelText: t('cancel'),
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const deleteCurrency = (id) => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    const currency = currencies.find((c) => c.id === id);
    if (currency?.is_default) {
      toast.error(t('cannot_delete_default'));
      return;
    }
    openConfirmModal({
      title: t('confirm_delete', { name: currency.label }),
      onConfirm: async () => {
        try {
          await deleteCurrencyApi(id);
          mutate();
          setSelectedIds((prev) => prev.filter((sid) => sid !== id));
          toast.success(t('currency_deleted'));
          const message = `Currency "${currency.label}" deleted.`;
          notify("currency_deleted", message);
        } catch (err) {
          console.error(err);
          const msg = err.response?.data?.message || t('delete_failed');
          toast.error(msg);
        }
      },
    });
  };

  const toggleSelect = (id) => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    setSelectedIds(filteredCurrencies.map((c) => c.id));
  };
  const clearAll = () => setSelectedIds([]);
  const bulkDelete = async () => {
    if (!requirePermission("manage_currencies", manageWarning)) {
      return;
    }
    const deletables = selectedIds.filter(
      (id) => !currencies.find((c) => c.id === id)?.is_default
    );
    try {
      await Promise.all(deletables.map((id) => deleteCurrencyApi(id)));
      clearAll();
      mutate();
      if (deletables.length) {
        toast.success(t('currencies_deleted'));
        const message = `Deleted ${deletables.length} currencies.`;
        notify("currency_bulk_deleted", message);
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || t('bulk_delete_failed');
      toast.error(msg);
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className={styles.page} dir={i18n.dir()}>
          <h1 className={styles.title}>💱 {t('title')}</h1>
          <p className={styles.errorText}>{t('error')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <div className={styles.page} dir={i18n.dir()}>
      <div className={styles.header}>
        <h1 className={styles.title}>💱 {t('title')}</h1>
        <Link
          href="/dashboard/admin/settings/currency/create"
          className={styles.buttonPrimary}
          onClick={(event) => {
            if (!requirePermission("manage_currencies", manageWarning)) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          aria-disabled={!canManage}
        >
          <FaPlus /> {t('add_currency')}
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <input
            type="text"
            placeholder={t('search_placeholder')}
            className={styles.input}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.select}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t('all')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
            <option value="auto">{t('auto_updated')}</option>
          </select>
        </div>

        {selectedIds.length > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.mutedText}>
              {t('selected')}: {selectedIds.length}
            </span>
            <button
              onClick={bulkDelete}
              className={styles.buttonDanger}
              disabled={!canManage}
            >
              {t('delete_selected')}
            </button>
            <button onClick={clearAll} className={styles.linkButton}>
              {t('clear')}
            </button>
          </div>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead className={styles.thead}>
            <tr>
              <th className={styles.th} style={{ textAlign: "center" }}>
                <input
                  type="checkbox"
                  onChange={(e) => (e.target.checked ? selectAll() : clearAll())}
                  checked={selectedIds.length === filteredCurrencies.length && filteredCurrencies.length > 0}
                />
              </th>
              <th className={styles.th}>{t('currency')}</th>
              <th className={styles.th}>{t('code')}</th>
              <th className={styles.th}>{t('symbol')}</th>
              <th className={styles.th}>{t('exchange_rate')}</th>
              <th className={styles.th}>{t('tax_rate')}</th>
              <th className={styles.th} style={{ textAlign: "center" }}>{t('auto_update')}</th>
              <th className={styles.th} style={{ textAlign: "center" }}>{t('status')}</th>
              <th className={styles.th} style={{ textAlign: "center" }}>{t('default')}</th>
              <th className={styles.th}>{t('last_updated')}</th>
              <th className={styles.th} style={{ textAlign: "center" }}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCurrencies.map((c) => (
              <tr
                key={c.id}
                className={`${styles.row} ${!c.is_active ? styles.rowInactive : ""}`}
              >
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleSelect(c.id)}
                  />
                </td>
                <td className={styles.td} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <img
                    src={`https://flagcdn.com/24x18/${c.code.slice(0, 2).toLowerCase()}.png`}
                    onError={(e) => (e.target.src = "/flags/default.png")}
                    className={styles.flag}
                    alt={c.code}
                  />
                  {c.label}
                </td>
                <td className={styles.td}>{c.code}</td>
                <td className={styles.td}>{c.symbol}</td>
                <td
                  className={`${styles.td} ${canManage ? styles.clickable : styles.clickableDisabled}`}
                  onClick={() => canManage && openRateModal(c)}
                  title={canManage ? "Click to edit" : undefined}
                >
                  {Number(c.exchange_rate).toFixed(2)}
                </td>
                <td className={styles.td}>{Number(c.tax_rate).toFixed(2)}</td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <button
                    onClick={() => toggleAutoUpdate(c.id)}
                    title="Toggle Auto Update"
                    className={`${styles.actionBtn} ${c.auto_update ? styles.textSuccess : styles.textMuted}`}
                    disabled={!canManage}
                  >
                    {c.auto_update ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <button
                    onClick={() => toggleActive(c.id)}
                    title="Toggle Status"
                    className={`${styles.statusBadge} ${c.is_active ? styles.badgeSuccess : styles.badgeWarning}`}
                    disabled={!canManage}
                  >
                    {c.is_active ? t('active') : t('inactive')}
                  </button>
                </td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <button
                    onClick={() => setDefault(c.id)}
                    title="Set as Default"
                    className={`${styles.statusBadge} ${c.is_default ? styles.badgeInfo : styles.badgeDefault}`}
                    disabled={!canManage}
                  >
                    <FaStar />
                  </button>
                </td>
                <td className={styles.td}>{c.last_updated ? new Date(c.last_updated).toLocaleDateString() : ''}</td>
                <td className={styles.td} style={{ textAlign: "center" }}>
                  <div className={styles.actions}>
                    <button
                      title="Refresh Rate"
                      className={`${styles.actionBtn} ${styles.textInfo}`}
                      onClick={() => refreshRate(c.id)}
                      disabled={!canManage}
                    >
                      <FaSync />
                    </button>
                    <Link
                      href={`/dashboard/admin/settings/currency/edit/${c.id}`}
                      className={`${styles.actionBtn} ${styles.textWarning}`}
                      onClick={(event) => {
                        if (!requirePermission("manage_currencies", manageWarning)) {
                          event.preventDefault();
                          event.stopPropagation();
                        }
                      }}
                      aria-disabled={!canManage}
                    >
                      <FaEdit />
                    </Link>
                    <button
                      title="Delete"
                      className={`${styles.actionBtn} ${styles.textDanger}`}
                      onClick={() => deleteCurrency(c.id)}
                      disabled={!canManage}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.pagination}>
        <span>
          {t('showing', { from: startIndex + 1, to: Math.min(startIndex + itemsPerPage, filteredCurrencies.length), total: filteredCurrencies.length })}
        </span>
        <div className={styles.pagerControls}>
          <button
            className={styles.pagerButton}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            {t('prev')}
          </button>
          <button
            className={styles.pagerButton}
            onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
            disabled={page === pageCount}
          >
            {t('next')}
          </button>
        </div>
      </div>
      {rateModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2 className={styles.modalTitle}>{t('edit_rate')}</h2>
            <input
              type="number"
              value={rateModal.value}
              onChange={(e) => setRateModal((prev) => ({ ...prev, value: e.target.value }))}
              className={styles.input}
              style={{ marginBottom: "1rem" }}
            />
            <div className={styles.modalActions}>
              <button
                onClick={closeRateModal}
                className={styles.buttonSecondary}
              >
                {t('cancel')}
              </button>
              <button
                onClick={saveRate}
                className={styles.buttonPrimary}
                disabled={!canManage}
              >
                {t('update')}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal {...confirmModal} onClose={closeConfirmModal} />
    </div>
  );
}

CurrencyManagerPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedCurrencyManagerPage = withAuthProtection(CurrencyManagerPage, {
  permissions: ["view_currencies"],
});

ProtectedCurrencyManagerPage.getLayout = CurrencyManagerPage.getLayout;

export default ProtectedCurrencyManagerPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
