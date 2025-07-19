// pages/dashboard/admin/settings/currencies/index.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import Link from "next/link";
import useSWR from "swr";

import withAuthProtection from "@/hooks/withAuthProtection";
import {
  fetchCurrencies,
  updateCurrency,
  deleteCurrency as deleteCurrencyApi,
} from "@/services/admin/currencyService";
import { FaPlus, FaStar, FaSync, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

const fetcher = () => fetchCurrencies();
function CurrencyManagerPage() {
  const { data: currencies = [], mutate } = useSWR("/currencies", fetcher);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const user = useAuthStore((state) => state.user);
  const refreshNotifications = useNotificationStore((state) => state.fetch);
  const refreshMessages = useMessageStore((state) => state.fetch);

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

  const toggleActive = async (id) => {
    const currency = currencies.find((c) => c.id === id);
    if (!currency) return;
    try {
      await updateCurrency(id, { is_active: !currency.is_active });
      mutate();
      const status = currency.is_active ? "Inactive" : "Active";
      toast.success(`Status updated to ${status}`);
      const message = `Currency "${currency.label}" status changed to ${status}.`;
      await createNotification({
        user_id: user.id,
        type: "currency_status_changed",
        message,
      });
      await sendChatMessage(user.id, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update status";
      toast.error(msg);
    }
  };

  const setDefault = async (id) => {
    try {
      const currency = currencies.find((c) => c.id === id);
      await updateCurrency(id, { is_default: true });
      mutate();
      toast.success("Set as default");
      const message = `Currency "${currency?.label || id}" set as default.`;
      await createNotification({
        user_id: user.id,
        type: "currency_set_default",
        message,
      });
      await sendChatMessage(user.id, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to set default";
      toast.error(msg);
    }
  };

  const toggleAutoUpdate = async (id) => {
    const currency = currencies.find((c) => c.id === id);
    if (!currency) return;
    try {
      await updateCurrency(id, { auto_update: !currency.auto_update });
      mutate();
      const status = currency.auto_update ? "disabled" : "enabled";
      toast.success(`Auto update ${status}`);
      const message = `Currency "${currency.label}" auto update ${status}.`;
      await createNotification({
        user_id: user.id,
        type: "currency_auto_update_changed",
        message,
      });
      await sendChatMessage(user.id, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update";
      toast.error(msg);
    }
  };

  const deleteCurrency = async (id) => {
    const currency = currencies.find((c) => c.id === id);
    if (currency?.is_default) return alert("Cannot delete default currency.");
    if (confirm(`Delete currency: ${currency.label}?`)) {
      try {
        await deleteCurrencyApi(id);
        mutate();
        setSelectedIds((prev) => prev.filter((sid) => sid !== id));
        toast.success("Currency deleted");
        const message = `Currency "${currency.label}" deleted.`;
        await createNotification({
          user_id: user.id,
          type: "currency_deleted",
          message,
        });
        await sendChatMessage(user.id, { text: message });
        refreshNotifications?.();
        refreshMessages?.();
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || "Failed to delete";
        toast.error(msg);
      }
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(filteredCurrencies.map((c) => c.id));
  const clearAll = () => setSelectedIds([]);
  const bulkDelete = async () => {
    const deletables = selectedIds.filter(
      (id) => !currencies.find((c) => c.id === id)?.is_default
    );
    try {
      await Promise.all(deletables.map((id) => deleteCurrencyApi(id)));
      clearAll();
      mutate();
      if (deletables.length) {
        toast.success("Currencies deleted");
        const message = `Deleted ${deletables.length} currencies.`;
        await createNotification({
          user_id: user.id,
          type: "currency_bulk_deleted",
          message,
        });
        await sendChatMessage(user.id, { text: message });
        refreshNotifications?.();
        refreshMessages?.();
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Bulk delete failed";
      toast.error(msg);
    }
  };

  return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">💱 Currency Manager</h1>
          <Link href="/dashboard/admin/settings/currency/create">
            <button className="bg-yellow-500 text-white px-4 py-2 rounded shadow flex items-center gap-2">
              <FaPlus /> Add Currency
            </button>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search by name or code"
              className="border p-2 rounded"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border p-2 rounded"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="auto">Auto-updated</option>
            </select>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Selected: {selectedIds.length}
              </span>
              <button
                onClick={bulkDelete}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              >
                Delete Selected
              </button>
              <button
                onClick={clearAll}
                className="text-sm text-gray-500 hover:text-black"
              >
                Clear
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
              <th className="p-3 text-left">Currency</th>
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Symbol</th>
              <th className="p-3 text-left">Exchange Rate</th>
              <th className="p-3 text-center">Auto Update</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Default</th>
              <th className="p-3 text-left">Last Updated</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCurrencies.map((c) => (
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
                <td className="p-3">{c.exchange_rate.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleAutoUpdate(c.id)}
                    title="Toggle Auto Update"
                    className={c.auto_update ? "text-green-600" : "text-gray-400"}
                  >
                    {c.auto_update ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleActive(c.id)}
                    title="Toggle Status"
                    className={c.is_active ? "text-green-600" : "text-red-500"}
                  >
                    {c.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setDefault(c.id)}
                    title="Set as Default"
                    className={c.is_default ? "text-yellow-500" : "text-gray-400"}
                  >
                    <FaStar />
                  </button>
                </td>
                <td className="p-3">{c.last_updated?.slice(0,10) || ''}</td>
                <td className="p-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      title="Refresh Rate"
                      className="text-blue-500"
                      onClick={() => alert(`Refresh rate for ${c.code}`)}
                    >
                      <FaSync />
                    </button>
                    <button
                      title="Delete"
                      className="text-red-600"
                      onClick={() => deleteCurrency(c.id)}
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
  );
}

CurrencyManagerPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};

const ProtectedCurrencyManagerPage = withAuthProtection(CurrencyManagerPage, [
  "admin",
  "superadmin",
]);

ProtectedCurrencyManagerPage.getLayout = CurrencyManagerPage.getLayout;

export default ProtectedCurrencyManagerPage;
