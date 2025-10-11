import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../../next-i18next.config.js';
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
  FaUniversity,
} from "react-icons/fa";
import OverviewTab from './OverviewTab';

import { fetchPayments } from '@/services/admin/paymentService';
import {
  fetchBankTransfers,
  approveBankTransfer,
  rejectBankTransfer,
} from '@/services/admin/bankTransferService';
import {
  fetchMethods,
  updateMethod,
  deleteMethod,
} from '@/services/admin/paymentMethodService';
import { fetchPaymentConfig, updatePaymentConfig } from '@/services/admin/paymentConfigService';
import { fetchPayouts, updatePayout } from '@/services/admin/payoutService';
import { toast } from 'react-toastify';
import { createNotification } from '@/services/notificationService';
import { sendChatMessage } from '@/services/messageService';
import useAuthStore from '@/store/auth/authStore';
import useNotificationStore from '@/store/notifications/notificationStore';
import useMessageStore from '@/store/messages/messageStore';
import useAdminNotice from '@/hooks/useAdminNotice';


const defaultConfig = {
  currency: "USD",
  platformCut: {
    class: 15,
    book: 10,
    tutorial: 20,
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
  const { t, i18n } = useTranslation('dashboard');
  const user = useAuthStore((s) => s.user);
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);

  const tabs = [
    { key: 'overview', label: t('paymentsPage.tabs.overview'), icon: <FaChartBar /> },
    { key: 'transactions', label: t('paymentsPage.tabs.transactions'), icon: <FaList /> },
    { key: 'methods', label: t('paymentsPage.tabs.methods'), icon: <FaMoneyCheckAlt /> },
    { key: 'configuration', label: t('paymentsPage.tabs.configuration'), icon: <FaCog /> },
    { key: 'payouts', label: t('paymentsPage.tabs.payouts'), icon: <FaWallet /> },
    { key: 'bankTransfers', label: t('paymentsPage.tabs.bankTransfers'), icon: <FaUniversity /> },
  ];

  const notifyUser = async (userId, type, message) => {
    if (!userId) {
      console.warn('Attempted to notify without a valid user id.');
      return;
    }
    try {
      await createNotification({ user_id: userId, type, message });
      await sendChatMessage(userId, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to send notification";
      toast.error(msg);
    }
  };
  const [activeTab, setActiveTab] = useState("overview");

  const [transactions, setTransactions] = useState([]);
  const [methods, setMethods] = useState([]);
  const notify = useAdminNotice();

  const [bankTransfers, setBankTransfers] = useState([]);

  const loadBankTransfers = async () => {
    try {
      const data = await fetchBankTransfers();
      setBankTransfers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load bank transfers', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [txns, mths, cfg, pouts] = await Promise.all([
          fetchPayments(),
          fetchMethods(),
          fetchPaymentConfig(),
          fetchPayouts(),
        ]);
        const safeTxns = Array.isArray(txns) ? txns : [];
        const safeMethods = Array.isArray(mths) ? mths : [];
        const safePayouts = Array.isArray(pouts) ? pouts : [];

        setTransactions(
          safeTxns.map((t) => ({
            ...t,
            date: t.paid_at || t.created_at,
            user: t.user_name,
            role: t.user_role,
            method: t.method_name,
            type: t.item_type,
            // normalize status to a consistent lowercase value for easier comparisons
            status: ((t.status || "").toLowerCase() === "success" ? "paid" : (t.status || "").toLowerCase()),
            platformFee: parseFloat(t.platform_fee ?? 0),
            instructorAmount: parseFloat(t.instructor_amount ?? t.amount),
          }))
        );
        setMethods(
          safeMethods.map((m) => ({
            ...m,
            configurable: true,
            configPath: `/dashboard/admin/payments/methods/configure/${m.id}`,
          }))
        );
        setPayouts(safePayouts);

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
    loadBankTransfers();
  }, []);



  const toggleStatus = async (id) => {
    try {
      const method = methods.find((m) => m.id === id);
      if (!method) return;
      await updateMethod(id, { active: !method.active });
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
      );
      const action = method.active ? 'deactivated' : 'activated';
      toast.success(`Payment method "${method.name}" ${action}`);
      const msg = `Payment method "${method.name}" status changed`;
      if (user?.id) {
        try {
          await notify('payment_method_status_changed', msg);
        } catch (err) {
          console.error('Failed to send payment method status notice', err);
        }
      }
    } catch (err) {
      console.error('Failed to update method', err);
      toast.error(t('paymentsPage.update_failed'));
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
      const action = newState ? 'set as default' : 'removed from default';
      toast.success(`Payment method "${method.name}" ${action}`);
      const msg = `Payment method "${method.name}" set as default`;
      if (user?.id) {
        try {
          await notify('payment_method_default_changed', msg);
        } catch (err) {
          console.error('Failed to send payment method default notice', err);
        }
      }
    } catch (err) {
      console.error('Failed to update default method', err);
      toast.error(t('paymentsPage.update_failed'));
    }
  };

  const handleDelete = async (id) => {
    try {
      const methodName = methods.find(m=>m.id===id)?.name;
      await deleteMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success(`Payment method "${methodName}" deleted`);
      const msg = `Payment method "${methodName}" deleted.`;
      if (user?.id) {
        try {
          await notify('payment_method_deleted', msg);
        } catch (err) {
          console.error('Failed to send payment method deleted notice', err);
        }
      }
    } catch (err) {
      console.error('Failed to delete method', err);
      toast.error(t('paymentsPage.delete_failed'));
    }
  };

  const [form, setForm] = useState(defaultConfig);
  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const errs = {};
    if (!data.currency) errs.currency = t('paymentsPage.currency_required');
    Object.entries(data.platformCut).forEach(([key, val]) => {
      if (val === "" || isNaN(val)) {
        errs[`platformCut.${key}`] = t('paymentsPage.required');
      } else if (val < 0 || val > 100) {
        errs[`platformCut.${key}`] = t('paymentsPage.between_0_100');
      }
    });
    if (!data.refundPolicy) errs.refundPolicy = t('paymentsPage.refund_policy_required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    validate(form);
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes("platformCut")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        platformCut: {
          ...prev.platformCut,
          [key]: value === "" ? "" : parseFloat(value),
        },
      }));
    } else if (name.includes("invoice")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        invoice: { ...prev.invoice, [key]: type === "checkbox" ? checked : value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleSave = async () => {
    if (!validate(form)) {
      toast.error(t('paymentsPage.correct_errors'));
      return;
    }
    try {
      await updatePaymentConfig(form);
      toast.success(t('paymentsPage.config_saved'));
    } catch (err) {
      toast.error(err?.response?.data?.message || t('paymentsPage.config_save_failed'));
    }
  };

  const isFormValid = Object.keys(errors).length === 0;

  const [payouts, setPayouts] = useState([]);

  const handleViewAllTransactions = () => setActiveTab('transactions');


  const updateStatus = async (id, newStatus) => {
    try {
      const payout = payouts.find((p) => p.id === id);
      const updated = await updatePayout(id, { status: newStatus });
      setPayouts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: updated.status } : p))
      );
      toast.success(t('paymentsPage.payout_status_updated'));
      if (user?.id) {
        await notifyUser(
          user.id,
          "payout_status_changed",
          `Payout ${id} marked as ${updated.status}.`
        );
      }
      if (payout?.instructor_id && payout.instructor_id !== user?.id) {
        notifyUser(
          payout.instructor_id,
          "payout_status_changed",
          `Your payout request ${id} was ${updated.status.toLowerCase()}.`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(t('paymentsPage.payout_status_failed'));
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveBankTransfer(id);
      toast.success(t('paymentsPage.status_updated'));
      loadBankTransfers();
    } catch (err) {
      console.error(err);
      toast.error(t('paymentsPage.update_failed'));
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectBankTransfer(id);
      toast.success(t('paymentsPage.status_updated'));
      loadBankTransfers();
    } catch (err) {
      console.error(err);
      toast.error(t('paymentsPage.update_failed'));
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
            onViewAll={handleViewAllTransactions}
          />
        );


      case "transactions":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <input
                type="text"
                placeholder={t('paymentsPage.search_placeholder')}
                className="border px-3 py-2 rounded w-60"
              />
              <select className="border px-3 py-2 rounded">
                <option>{t('paymentsPage.all_methods')}</option>
                {methods.map((m) => (
                  <option key={m.id}>{m.name}</option>
                ))}
              </select>
              <select className="border px-3 py-2 rounded">
                <option>{t('paymentsPage.all_status')}</option>
                <option>{t('paymentsPage.success')}</option>
                <option>{t('paymentsPage.pending')}</option>
                <option>{t('paymentsPage.failed')}</option>
                <option>{t('paymentsPage.refunded')}</option>
              </select>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow">{t('paymentsPage.export_csv')}</button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">{t('paymentsPage.transaction_id')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.date')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.user')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.type')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.method')}</th>
                      <th className="px-4 py-2">{t('paymentsPage.amount')}</th>
                      <th className="px-4 py-2">{t('paymentsPage.platform_fee')}</th>
                      <th className="px-4 py-2">{t('paymentsPage.net_amount')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.status')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.actions')}</th>
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
                      <td className="px-4 py-2 font-semibold text-green-600">${parseFloat(txn.amount ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-2">${parseFloat(txn.platformFee ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-2">${parseFloat(txn.instructorAmount ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${txn.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : txn.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : txn.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {t(`paymentsPage.${txn.status}`)}
                        </span>
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        <button className="text-blue-600 hover:underline text-xs">{t('paymentsPage.view')}</button>
                        <button className="text-red-600 hover:underline text-xs">{t('paymentsPage.refund')}</button>
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
              <h2 className="text-xl font-semibold">{t('paymentsPage.tabs.methods')}</h2>
              <button
                onClick={() => router.push("/dashboard/admin/payments/methods/create")}
                className="bg-yellow-500 text-white px-4 py-2 rounded shadow flex items-center gap-2"
              >
                <FaPlus /> {t('paymentsPage.add_new')}
              </button>
            </div>

            <div className="overflow-x-auto bg-white shadow rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left">
                    <tr>
                      <th className="px-4 py-2">{t('paymentsPage.name')}</th>
                      <th className="px-4 py-2">{t('paymentsPage.type')}</th>
                      <th className="px-4 py-2">{t('paymentsPage.status')}</th>
                      <th className="px-4 py-2">{t('paymentsPage.default')}</th>
                      <th className="px-4 py-2">{t('paymentsPage.actions')}</th>
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
                            {t('paymentsPage.configure')}
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(method.id)}
                          className="px-3 py-1 bg-red-500 text-white rounded shadow text-xs hover:bg-red-600 transition"
                        >
                          {t('delete')}
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
            <h2 className="text-xl font-semibold">{t('paymentsPage.configuration_title')}</h2>

            <div>
              <label className="block font-medium mb-1">{t('paymentsPage.default_currency')}</label>
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
              {errors.currency && (
                <p className="text-red-500 text-sm mt-1">{errors.currency}</p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-2">{t('paymentsPage.platform_commission')}</label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(form.platformCut).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-sm capitalize mb-1">
                      {t(`paymentsPage.item_types.${key}`, key)}
                    </label>
                    <input
                      type="number"
                      name={`platformCut.${key}`}
                      value={val}
                      min={0}
                      max={100}
                      onChange={handleChange}
                      className="border px-3 py-2 rounded w-full"
                    />
                    {errors[`platformCut.${key}`] && (
                      <p className="text-red-500 text-sm mt-1">{errors[`platformCut.${key}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-medium">{t('paymentsPage.invoice_settings')}</label>
              <input
                type="text"
                placeholder={t('paymentsPage.logo_url')}
                name="invoice.logoUrl"
                value={form.invoice.logoUrl}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
              />
              <textarea
                placeholder={t('paymentsPage.invoice_footer_text')}
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
                {t('paymentsPage.auto_send_receipt')}
              </label>
            </div>

            <div>
              <label className="block font-medium mb-1">{t('paymentsPage.refund_policy')}</label>
              <textarea
                name="refundPolicy"
                value={form.refundPolicy}
                onChange={handleChange}
                className="border px-3 py-2 rounded w-full"
                rows={4}
              />
              {errors.refundPolicy && (
                <p className="text-red-500 text-sm mt-1">{errors.refundPolicy}</p>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!isFormValid}
              className={`bg-indigo-600 text-white px-6 py-2 rounded shadow ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {t('paymentsPage.save_configuration')}
            </button>
          </div>
        );

      case "payouts":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{t('paymentsPage.instructor_payouts')}</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded shadow">{t('paymentsPage.export_csv')}</button>
            </div>

            <div className="overflow-x-auto bg-white shadow rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="px-4 py-2">{t('paymentsPage.payout_id')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.date')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.instructor')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.amount')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.method')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.status')}</th>
                    <th className="px-4 py-2">{t('paymentsPage.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono">{p.id}</td>
                      <td className="px-4 py-2">{p.date}</td>
                      <td className="px-4 py-2 font-medium">{p.instructor}</td>
                      <td className="px-4 py-2 text-green-600 font-semibold">${parseFloat(p.amount ?? 0).toFixed(2)}</td>
                      <td className="px-4 py-2">{p.method}</td>
                      <td className="px-4 py-2">
                        {(() => {
                          const status = (p.status || '').toLowerCase();
                          const color =
                            status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800';
                          return (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
                              {t(`paymentsPage.${status}`)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-2 space-x-2">
                        {p.status?.toLowerCase() === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(p.id, "Paid")}
                              className="text-green-600 hover:underline text-xs"
                            >
                              {t('paymentsPage.mark_paid')}
                            </button>
                            <button
                              onClick={() => updateStatus(p.id, "Rejected")}
                              className="text-red-600 hover:underline text-xs"
                            >
                              {t('paymentsPage.reject')}
                            </button>
                          </>
                        )}
                        {p.status?.toLowerCase() === "rejected" && (
                          <button
                            onClick={() => updateStatus(p.id, "Pending")}
                            className="text-gray-500 hover:underline text-xs"
                          >
                            {t('paymentsPage.reopen')}
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

      case "bankTransfers":
        return (
          <div className="overflow-x-auto bg-white shadow rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-2">{t('paymentsPage.user')}</th>
                  <th className="px-4 py-2">{t('paymentsPage.order_id')}</th>
                  <th className="px-4 py-2">{t('paymentsPage.amount')}</th>
                  <th className="px-4 py-2">Receipt</th>
                  <th className="px-4 py-2">{t('paymentsPage.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {bankTransfers.map((bt) => (
                  <tr key={bt.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{bt.student_name || bt.student?.name || bt.user_name}</td>
                    <td className="px-4 py-2">{bt.order_id}</td>
                    <td className="px-4 py-2 font-semibold text-green-600">${parseFloat(bt.amount ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      {bt.receipt_url && (
                        <img src={bt.receipt_url} alt="receipt" className="w-24 h-24 object-cover" />
                      )}
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      <button onClick={() => handleApprove(bt.id)} className="text-green-600 hover:underline text-xs">
                        {t('paymentsPage.approve')}
                      </button>
                      <button onClick={() => handleReject(bt.id)} className="text-red-600 hover:underline text-xs">
                        {t('paymentsPage.reject')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title={t('paymentsPage.title')}>
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

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
