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
        <div className="p-6" dir={i18n.dir()}>
          <h1 className="text-2xl font-bold mb-4">💱 {t('title')}</h1>
          <p className="text-red-600">{t('error')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
      <div className="p-6" dir={i18n.dir()}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">💱 {t('title')}</h1>
          <Link href="/dashboard/admin/settings/currency/create">
            <button
              className="bg-yellow-500 text-white px-4 py-2 rounded shadow flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={(event) => {
                if (!requirePermission("manage_currencies", manageWarning)) {
                  event.preventDefault();
                  event.stopPropagation();
                }
              }}
              disabled={!canManage}
            >
              <FaPlus /> {t('add_currency')}
            </button>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('search_placeholder')}
              className="border p-2 rounded"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border p-2 rounded"
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
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {t('selected')}: {selectedIds.length}
              </span>
              <button
                onClick={bulkDelete}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!canManage}
              >
                {t('delete_selected')}
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-black"
              >
                {t('clear')}
              </button>
            </div>
          )}
        </div>

        <table className="w-full text-sm bg-white border rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-center">
                <input
                  type="checkbox"
                  onChange={(e) => (e.target.checked ? selectAll() : clearAll())}
                  checked={selectedIds.length === filteredCurrencies.length && filteredCurrencies.length > 0}
                />
              </th>
              <th className="p-3 text-left">{t('currency')}</th>
              <th className="p-3 text-left">{t('code')}</th>
              <th className="p-3 text-left">{t('symbol')}</th>
              <th className="p-3 text-left">{t('exchange_rate')}</th>
              <th className="p-3 text-left">{t('tax_rate')}</th>
              <th className="p-3 text-center">{t('auto_update')}</th>
              <th className="p-3 text-center">{t('status')}</th>
              <th className="p-3 text-center">{t('default')}</th>
              <th className="p-3 text-left">{t('last_updated')}</th>
              <th className="p-3 text-center">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCurrencies.map((c) => (
              <tr
                key={c.id}
                className={`border-t hover:bg-gray-50 transition ${!c.is_active ? "bg-red-50" : ""}`}
              >
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => toggleSelect(c.id)}
                  />
                </td>
                <td className="p-3 flex items-center gap-2">
                  <img
                    src={`https://flagcdn.com/24x18/${c.code.slice(0, 2).toLowerCase()}.png`}
                    onError={(e) => (e.target.src = "/flags/default.png")}
                    className="w-5 h-3 border rounded"
                    alt={c.code}
                  />
                  {c.label}
                </td>
                <td className="p-3">{c.code}</td>
                <td className="p-3">{c.symbol}</td>
                <td
                  className={`p-3 ${canManage ? "cursor-pointer" : "cursor-not-allowed text-gray-500"}`}
                  onClick={() => openRateModal(c)}
                  title="Click to edit"
                >
                  {Number(c.exchange_rate).toFixed(2)}
                </td>
                <td className="p-3">{Number(c.tax_rate).toFixed(2)}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleAutoUpdate(c.id)}
                    title="Toggle Auto Update"
                    className={`${c.auto_update ? "text-green-600" : "text-gray-400"} disabled:opacity-60 disabled:cursor-not-allowed`}
                    disabled={!canManage}
                  >
                    {c.auto_update ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleActive(c.id)}
                    title="Toggle Status"
                    className={`${c.is_active ? "text-green-600" : "text-red-500"} disabled:opacity-60 disabled:cursor-not-allowed`}
                    disabled={!canManage}
                  >
                    {c.is_active ? t('active') : t('inactive')}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setDefault(c.id)}
                    title="Set as Default"
                    className={`${c.is_default ? "text-yellow-500" : "text-gray-400"} disabled:opacity-60 disabled:cursor-not-allowed`}
                    disabled={!canManage}
                  >
                    <FaStar />
                  </button>
                </td>
                <td className="p-3">{c.last_updated ? new Date(c.last_updated).toLocaleDateString() : ''}</td>
                <td className="p-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      title="Refresh Rate"
                      className="text-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={() => refreshRate(c.id)}
                      disabled={!canManage}
                    >
                      <FaSync />
                    </button>
                    <Link href={`/dashboard/admin/settings/currency/edit/${c.id}`}>
                      <button
                        title="Edit"
                        className="text-yellow-600 disabled:opacity-60 disabled:cursor-not-allowed"
                        onClick={(event) => {
                          if (!requirePermission("manage_currencies", manageWarning)) {
                            event.preventDefault();
                            event.stopPropagation();
                          }
                        }}
                        disabled={!canManage}
                      >
                        <FaEdit />
                      </button>
                    </Link>
                    <button
                      title="Delete"
                      className="text-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div className="flex justify-between mt-4 text-sm text-gray-500">
          <span>
            {t('showing', { from: startIndex + 1, to: Math.min(startIndex + itemsPerPage, filteredCurrencies.length), total: filteredCurrencies.length })}
          </span>
          <div className="space-x-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
            >
              {t('prev')}
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(p + 1, pageCount))}
              disabled={page === pageCount}
            >
              {t('next')}
            </button>
          </div>
        </div>
        {rateModal.isOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow w-80">
              <h2 className="text-lg font-semibold mb-4">{t('edit_rate')}</h2>
              <input
                type="number"
                value={rateModal.value}
                onChange={(e) => setRateModal((prev) => ({ ...prev, value: e.target.value }))}
                className="w-full border p-2 rounded mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeRateModal}
                  className="px-3 py-1 border rounded"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={saveRate}
                  className="px-3 py-1 bg-yellow-500 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed"
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
