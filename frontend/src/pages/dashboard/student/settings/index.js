import StudentLayout from "@/components/layouts/StudentLayout";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FaUser,
  FaCogs,
  FaShieldAlt,
  FaCreditCard,
  FaPalette,
} from "react-icons/fa";
import api from "@/services/api/api";
import useSubscriptionStore from "@/store/subscriptionStore";

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const subscription = useSubscriptionStore((state) => state.plan);
  const loadingSub = useSubscriptionStore((state) => state.loading);
  const fetchSubscription = useSubscriptionStore((state) => state.fetch);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoiceError, setInvoiceError] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    setInvoiceError(null);
    try {
      const { data } = await api.get("/invoices/student");
      setInvoices(data?.data || []);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
      setInvoiceError(err);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setLoadingPayments(true);
    setPaymentsError(null);
    try {
      const { data } = await api.get("/payments/student");
      setPayments(data?.data || []);
    } catch (err) {
      console.error("Failed to fetch payments", err);
      setPaymentsError(err);
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription("student");
    loadInvoices();
    loadPayments();
  }, [fetchSubscription, loadInvoices, loadPayments]);

  const invoicesByPayment = useMemo(() => {
    const map = new Map();
    invoices.forEach((invoice) => {
      if (invoice?.payment_id) {
        map.set(invoice.payment_id, invoice);
      }
    });
    return map;
  }, [invoices]);

  const formatAmount = (value, currency = "USD") => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return value != null ? `${value} ${currency || ""}`.trim() : "-";
    }
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency || "USD",
      }).format(numeric);
    } catch {
      return `${numeric.toFixed(2)} ${currency || ""}`.trim();
    }
  };

  const formatStatus = (status) => {
    if (!status) return "-";
    return status
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const subscriptionEnd = subscription?.end_date
    ? new Date(subscription.end_date)
    : null;
  const daysRemaining =
    subscriptionEnd && !Number.isNaN(subscriptionEnd.getTime())
      ? Math.ceil(
          (subscriptionEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null;
  const renewalClass =
    daysRemaining === null
      ? ""
      : daysRemaining <= 0
      ? "text-red-600"
      : daysRemaining <= 7
      ? "text-orange-500"
      : "text-green-600";
  const subscriptionStatusLabel = subscription?.status
    ? formatStatus(subscription.status)
    : null;

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await api.post("/user-subscriptions/upgrade");
      await fetchSubscription("student");
      toast.success("Subscription upgraded");
    } catch (err) {
      toast.error("Failed to upgrade subscription");
      console.error("Upgrade failed", err);
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await api.post("/user-subscriptions/cancel");
      await fetchSubscription("student");
      toast.success("Subscription cancelled");
    } catch (err) {
      toast.error("Failed to cancel subscription");
      console.error("Cancel failed", err);
    } finally {
      setCanceling(false);
    }
  };

  const tabs = [
    { id: "account", label: "Account Info", icon: <FaUser /> },
    { id: "preferences", label: "Learning Preferences", icon: <FaCogs /> },
    { id: "privacy", label: "Privacy & Security", icon: <FaShieldAlt /> },
    { id: "billing", label: "Billing", icon: <FaCreditCard /> },
    { id: "ui", label: "UI Preferences", icon: <FaPalette /> },
  ];

  return (
    <StudentLayout>
      <div className="p-6 max-w-5xl mx-auto text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-yellow-500">⚙️ Student Settings</h1>

        {/* Tabs */}
        <div className="flex gap-4 border-b pb-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-2 pb-1 font-medium transition ${
                activeTab === tab.id
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-yellow-600"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content Panels */}
        {activeTab === "account" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">Account Info</h2>
            <input type="text" placeholder="Full Name" className="w-full border px-4 py-2 rounded" />
            <input type="email" placeholder="Email" className="w-full border px-4 py-2 rounded" />
            <hr />
            <h3 className="font-medium">Change Password</h3>
            <input type="password" placeholder="Current Password" className="w-full border px-4 py-2 rounded" />
            <input type="password" placeholder="New Password" className="w-full border px-4 py-2 rounded" />
            <input type="password" placeholder="Confirm New Password" className="w-full border px-4 py-2 rounded" />
            <button className="bg-yellow-500 px-4 py-2 rounded text-black font-medium hover:bg-yellow-600">Save Changes</button>
          </div>
        )}

        {activeTab === "preferences" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">Learning Preferences</h2>
            <label className="block font-medium">Preferred Language</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>English</option>
              <option>Arabic</option>
            </select>
            <label className="block font-medium">Subtitle Options</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>On</option>
              <option>Off</option>
            </select>
            <label className="block font-medium">Default Video Speed</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>1x</option>
              <option>1.25x</option>
              <option>1.5x</option>
              <option>2x</option>
            </select>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">Privacy & Security</h2>
            <p>🔒 Two-Factor Authentication: <span className="font-medium">Off</span> <button className="text-blue-600 underline ml-2">Enable</button></p>
            <p>📍 Recent Login: Riyadh, KSA - Chrome</p>
            <button className="text-red-600 underline">Download my data</button>
            <button className="text-red-600 underline">Delete account</button>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-6">
            <h2 className="text-lg font-semibold">Billing</h2>

            <section className="space-y-2">
              <h3 className="font-medium">Subscription</h3>
              {loadingSub ? (
                <p>Loading subscription...</p>
              ) : subscription ? (
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Plan:</span>{" "}
                    {subscription.name}
                  </p>
                  {subscriptionStatusLabel && (
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      {subscriptionStatusLabel}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Plan ID:</span>{" "}
                    {subscription.plan_id}
                  </p>
                  {subscription.slug && (
                    <p>
                      <span className="font-medium">Plan Code:</span>{" "}
                      {subscription.slug}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Current Period:</span>{" "}
                    {formatDate(subscription.start_date)} –{" "}
                    {formatDate(subscription.end_date)}
                  </p>
                  {daysRemaining !== null && (
                    <p className={`font-medium ${renewalClass}`}>
                      {daysRemaining > 0
                        ? `Renews in ${daysRemaining} day${
                            daysRemaining === 1 ? "" : "s"
                          } (${formatDate(subscription.end_date)})`
                        : `Plan expired on ${formatDate(
                            subscription.end_date
                          )}`}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <button
                      onClick={handleUpgrade}
                      disabled={upgrading}
                      className={`bg-yellow-500 px-4 py-2 rounded text-black font-medium hover:bg-yellow-600 ${
                        upgrading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {upgrading ? "Upgrading..." : "Upgrade"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={canceling}
                      className={`bg-red-500 px-4 py-2 rounded text-white font-medium hover:bg-red-600 ${
                        canceling ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {canceling ? "Cancelling..." : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <p>No active subscription.</p>
              )}
            </section>

            <section>
              <h3 className="font-medium">Payment History</h3>
              {loadingPayments ? (
                <p>Loading payments...</p>
              ) : paymentsError ? (
                <div>
                  <p className="text-red-600">Failed to load payments.</p>
                  <button
                    onClick={loadPayments}
                    className="text-blue-600 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : payments.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="py-2 pr-4">Date</th>
                        <th className="py-2 pr-4">Item</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2 pr-4">Method</th>
                        <th className="py-2 pr-4">Reference</th>
                        <th className="py-2 pr-4">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => {
                        const label =
                          payment.item_title ||
                          payment.plan_name ||
                          payment.class_title ||
                          payment.tutorial_title ||
                          payment.book_title ||
                          payment.item_type;
                        const invoice = invoicesByPayment.get(payment.id);
                        return (
                          <tr key={payment.id} className="border-t">
                            <td className="py-2 pr-4">
                              {formatDateTime(payment.created_at)}
                            </td>
                            <td className="py-2 pr-4">{label}</td>
                            <td className="py-2 pr-4">
                              {formatAmount(payment.amount, payment.currency)}
                            </td>
                            <td className="py-2 pr-4">
                              {formatStatus(payment.status)}
                            </td>
                            <td className="py-2 pr-4">
                              {payment.method_name || "—"}
                            </td>
                            <td className="py-2 pr-4">
                              {payment.reference_id || "—"}
                            </td>
                            <td className="py-2 pr-4">
                              {invoice ? (
                                <a
                                  href={invoice.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline"
                                >
                                  Download
                                </a>
                              ) : (
                                "—"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>No payments found.</p>
              )}
            </section>

            <section>
              <h3 className="font-medium">Invoices</h3>
              {loadingInvoices ? (
                <p>Loading invoices...</p>
              ) : invoiceError ? (
                <div>
                  <p className="text-red-600">Failed to load invoices.</p>
                  <button
                    onClick={loadInvoices}
                    className="text-blue-600 underline"
                  >
                    Retry
                  </button>
                </div>
              ) : invoices.length ? (
                <ul className="space-y-2">
                  {invoices.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          Invoice {inv.id} •{" "}
                          {formatAmount(inv.amount, inv.currency)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Payment {inv.payment_id}
                          {inv.created_at
                            ? ` • ${formatDate(inv.created_at)}`
                            : ""}
                        </p>
                      </div>
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No invoices found.</p>
              )}
            </section>
          </div>
        )}

        {activeTab === "ui" && (
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-lg font-semibold">UI Preferences</h2>
            <label className="block font-medium">App Language</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>English</option>
              <option>Arabic</option>
            </select>
            <label className="block font-medium">Time Zone</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>Asia/Riyadh</option>
              <option>UTC</option>
            </select>
            <label className="block font-medium">Theme</label>
            <select className="w-full border px-4 py-2 rounded">
              <option>Light</option>
              <option>Dark</option>
            </select>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
