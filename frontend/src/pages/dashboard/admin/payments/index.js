import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  FaChartBar,
  FaList,
  FaCog,
  FaWallet,
  FaMoneyCheckAlt,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaStar,
} from "react-icons/fa";
import OverviewTab from './OverviewTab';

import { fetchPayments } from '@/services/admin/paymentService';
import {
  fetchMethods,
  updateMethod,
  deleteMethod,
} from '@/services/admin/paymentMethodService';
import { fetchPaymentConfig, updatePaymentConfig } from '@/services/admin/paymentConfigService';
import { fetchPayouts, updatePayout } from '@/services/admin/payoutService';
import { toast } from 'react-toastify';

const tabs = [
  { key: "overview", label: "Overview", icon: <FaChartBar /> },
  { key: "transactions", label: "Transactions", icon: <FaList /> },
  { key: "methods", label: "Payment Methods", icon: <FaMoneyCheckAlt /> },
  { key: "configuration", label: "Configuration", icon: <FaCog /> },
  { key: "payouts", label: "Payouts", icon: <FaWallet /> },
];


const defaultConfig = {
  currency: "USD",
  platformCut: {
    subscriptions: 10,
    classSales: 15,
    adPayments: 20,
    bookings: 5,
  },
  invoice: {
    logoUrl: "",
    footerText: "Thank you for using our platform!",
    autoEmail: true,
  },
  refundPolicy:
    "Refunds can be requested within 7 days of payment. Contact support for processing.",
};


export default function AdminPaymentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const [transactions, setTransactions] = useState([]);
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [txns, mths, cfg, pouts] = await Promise.all([
          fetchPayments(),
          fetchMethods(),
          fetchPaymentConfig(),
          fetchPayouts(),
        ]);
        setTransactions(txns);
        setMethods(mths);
        setPayouts(pouts);

        if (cfg) {
          const merged = {
            ...defaultConfig,
            ...cfg,
            platformCut: {
              ...defaultConfig.platformCut,
              ...(cfg.platformCut || {}),
            },
            invoice: {
              ...defaultConfig.invoice,
              ...(cfg.invoice || {}),
            },
          };
          setForm(merged);
        } else {
          setForm(defaultConfig);
        }

      } catch (err) {
        console.error('Failed to load payment data', err);
      }
    };
    loadData();
  }, []);



  const toggleStatus = async (id) => {
    try {
      const method = methods.find((m) => m.id === id);
      if (!method) return;
      await updateMethod(id, { active: !method.active });
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
      );
    } catch (err) {
      console.error('Failed to update method', err);
    }
  };

  const toggleDefault = async (id) => {
    try {
      const method = methods.find((m) => m.id === id);
      if (!method) return;
      const newState = !method.is_default;
      await updateMethod(id, { is_default: newState });
      setMethods((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, is_default: newState }
            : newState
            ? { ...m, is_default: false }
            : m
        )
      );
    } catch (err) {
      console.error('Failed to update default method', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete method', err);
    }
  };

  const [form, setForm] = useState(defaultConfig);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes("platformCut")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        platformCut: { ...prev.platformCut, [key]: parseFloat(value) },
      }));
    } else if (name.includes("invoice")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        invoice: { ...prev.invoice, [key]: type === "checkbox" ? checked : value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      await updatePaymentConfig(form);
      toast.success("Configuration saved successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save configuration");
    }
  };

  const [payouts, setPayouts] = useState([]);


  const updateStatus = async (id, newStatus) => {
    try {
      const updated = await updatePayout(id, { status: newStatus });
      setPayouts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p))
      );
    } catch (err) {
      toast.error("Failed to update payout status");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            transactions={transactions}
            methods={methods}
            payouts={payouts}
            onViewAll={() => router.push("/dashboard/admin/payments/transactions")}
          />
        );


      case "transactions":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <input
                type="text"
                placeholder="Search by user or ID..."
                className="border px-3 py-2 rounded w-60"
              />
              <select className="border px-3 py-2 rounded">
                <option>All Methods</option>
                <option>PayPal</option>
                <option>Stripe</option>
                <option>Bank Transfer</option>
                <option>Crypto Wallet</option>
              </select>
              <select className="border px-3 py-2 rounded">
                <option>All Statuses</option>
                <option>Success</option>
                <option>Pending</option>
                <option>Failed</option>
                <option>Refunded</option>
              </select>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow">Export CSV</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">Transaction ID</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Method</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono">{txn.id}</td>
                      <td className="px-4 py-2">{txn.date}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{txn.user}</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{txn.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2">{txn.type}</td>
                      <td className="px-4 py-2">{txn.method}</td>
                      <td className="px-4 py-2 font-semibold text-green-600">${txn.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${txn.status === "Success"
                            ? "bg-green-100 text-green-800"
                            : txn.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button className="text-blue-600 hover:underline text-xs">View</button>
                        <button className="text-red-600 hover:underline text-xs">Refund</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "methods":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Payment Methods</h2>
              <button
                onClick={() => router.push("/dashboard/admin/payments/methods/create")}
                className="bg-yellow-500 text-white px-4 py-2 rounded shadow flex items-center gap-2"
              >
                <FaPlus /> Add New
              </button>
            </div>

            <div className="overflow-x-auto bg-white shadow rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Default</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((method) => (
                    <tr key={method.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium flex items-center gap-2">
                        {method.name === 'Stripe' && '💳'}
                        {method.name === 'PayPal' && '🅿️'}
                        {method.name === 'Bank Transfer' && '🏦'}
                        {method.name === 'Crypto Wallet' && '₿'}
                        {method.name}
                        {method.is_default && <FaStar className="text-yellow-500" />}
                      </td>
                      <td className="px-4 py-2">{method.type}</td>
                      <td className="px-4 py-2">
                        <button onClick={() => toggleStatus(method.id)} className="text-xl">
                          {method.active ? (
                            <FaToggleOn className="text-green-500" />
                          ) : (
                            <FaToggleOff className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => toggleDefault(method.id)} className="text-xl">
                          {method.is_default ? (
                            <FaToggleOn className="text-yellow-500" />
                          ) : (
                            <FaToggleOff className="text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        {method.configurable && method.configPath && (
                          <button
                            onClick={() => router.push(method.configPath)}
                            className="px-3 py-1 bg-indigo-600 text-white rounded shadow text-xs hover:bg-indigo-700 transition"
                          >
                            Configure
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(method.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded shadow text-xs hover:bg-red-600 transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );


      case "configuration":
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Platform Payment Configuration</h2>

            <div>
              <label className="block font-medium mb-1">Default Currency</label>
              <select
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-60"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="SAR">SAR - Saudi Riyal</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-2">Platform Commission (%)</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(form.platformCut).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-sm capitalize mb-1">{key}</label>
                    <input
                      type="number"
                      name={`platformCut.${key}`}
                      value={val}
                      min={0}
                      max={100}
                      onChange={handleChange}
                      className="border px-3 py-2 rounded w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-medium">Invoice Settings</label>
              <input
                type="text"
                placeholder="Logo URL"
                name="invoice.logoUrl"
                value={form.invoice.logoUrl}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
              />
              <textarea
                placeholder="Invoice Footer Text"
                name="invoice.footerText"
                value={form.invoice.footerText}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
                rows={3}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="invoice.autoEmail"
                  checked={form.invoice.autoEmail}
                  onChange={handleChange}
                />
                Auto-send receipt email to users
              </label>
            </div>

            <div>
              <label className="block font-medium mb-1">Refund Policy</label>
              <textarea
                name="refundPolicy"
                value={form.refundPolicy}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
                rows={4}
              />
            </div>

            <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded shadow">Save Configuration</button>
          </div>
        );

      case "payouts":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Instructor Payouts</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow">Export CSV</button>
            </div>

            <div className="overflow-x-auto bg-white shadow rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">Payout ID</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Instructor</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Method</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono">{p.id}</td>
                      <td className="px-4 py-2">{p.date}</td>
                      <td className="px-4 py-2 font-medium">{p.instructor}</td>
                      <td className="px-4 py-2 text-green-600 font-semibold">${p.amount.toFixed(2)}</td>
                      <td className="px-4 py-2">{p.method}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${p.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : p.status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        {p.status === "Pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(p.id, "Paid")}
                              className="text-green-600 hover:underline text-xs"
                            >
                              Mark as Paid
                            </button>
                            <button
                              onClick={() => updateStatus(p.id, "Rejected")}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {p.status === "Rejected" && (
                          <button
                            onClick={() => updateStatus(p.id, "Pending")}
                            className="text-gray-500 hover:underline text-xs"
                          >
                            Reopen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title="Payments Dashboard">
      <div className="flex flex-col space-y-4">
        <div className="flex space-x-2 border-b pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-t-md text-sm font-semibold flex items-center gap-2 
                ${activeTab === tab.key
                  ? "bg-white shadow text-black border-t border-x"
                  : "bg-gray-100 text-gray-500"
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4 bg-white shadow rounded">{renderTabContent()}</div>
      </div>
    </AdminLayout>
  );
}
