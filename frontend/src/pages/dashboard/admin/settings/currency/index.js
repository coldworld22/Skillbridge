// pages/dashboard/admin/settings/currencies/index.js
import AdminLayout from "@/components/layouts/AdminLayout";
import { useState, useMemo } from "react";
import Link from "next/link";
import { FaPlus, FaStar, FaSync, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";

const mockCurrencies = [
  {
    id: 1,
    label: "US Dollar",
    code: "USD",
    symbol: "$",
    exchangeRate: 1,
    active: true,
    default: true,
    autoUpdate: true,
    lastUpdated: "2025-05-13",
  },
  {
    id: 2,
    label: "Euro",
    code: "EUR",
    symbol: "€",
    exchangeRate: 0.93,
    active: true,
    default: false,
    autoUpdate: true,
    lastUpdated: "2025-05-13",
  },
  {
    id: 3,
    label: "Saudi Riyal",
    code: "SAR",
    symbol: "﷼",
    exchangeRate: 3.75,
    active: false,
    default: false,
    autoUpdate: false,
    lastUpdated: "2025-05-01",
  },
];

export default function CurrencyManagerPage() {
  const [currencies, setCurrencies] = useState(mockCurrencies);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredCurrencies = useMemo(() => {
    return currencies.filter((c) => {
      const matchSearch =
        c.label.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "active" && c.active) ||
        (filter === "inactive" && !c.active) ||
        (filter === "auto" && c.autoUpdate);
      return matchSearch && matchFilter;
    });
  }, [currencies, search, filter]);

  const toggleActive = (id) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const setDefault = (id) => {
    setCurrencies((prev) =>
      prev.map((c) => ({ ...c, default: c.id === id }))
    );
  };

  const toggleAutoUpdate = (id) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, autoUpdate: !c.autoUpdate } : c))
    );
  };

  const deleteCurrency = (id) => {
    const currency = currencies.find((c) => c.id === id);
    if (currency.default) return alert("Cannot delete default currency.");
    if (confirm(`Delete currency: ${currency.label}?`)) {
      setCurrencies((prev) => prev.filter((c) => c.id !== id));
      setSelectedIds((prev) => prev.filter((sid) => sid !== id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(filteredCurrencies.map((c) => c.id));
  const clearAll = () => setSelectedIds([]);
  const bulkDelete = () => {
    const deletables = selectedIds.filter(
      (id) => !currencies.find((c) => c.id === id)?.default
    );
    setCurrencies((prev) => prev.filter((c) => !deletables.includes(c.id)));
    clearAll();
  };

  return (
    <AdminLayout>
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
                className={`border-t hover:bg-gray-50 transition ${!c.active ? "bg-red-50" : ""}`}
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
                <td className="p-3">{c.exchangeRate.toFixed(2)}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleAutoUpdate(c.id)}
                    title="Toggle Auto Update"
                    className={c.autoUpdate ? "text-green-600" : "text-gray-400"}
                  >
                    {c.autoUpdate ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggleActive(c.id)}
                    title="Toggle Status"
                    className={c.active ? "text-green-600" : "text-red-500"}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => setDefault(c.id)}
                    title="Set as Default"
                    className={c.default ? "text-yellow-500" : "text-gray-400"}
                  >
                    <FaStar />
                  </button>
                </td>
                <td className="p-3">{c.lastUpdated}</td>
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
    </AdminLayout>
  );
}