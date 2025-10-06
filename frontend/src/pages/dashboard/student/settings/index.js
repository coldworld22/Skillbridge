import StudentLayout from "@/components/layouts/StudentLayout";
import { useState, useEffect } from "react";
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
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    setInvoiceError(null);
    try {
      const { data } = await api.get("invoices/student");
      setInvoices(data?.data || []);
    } catch (err) {
      console.error("Failed to fetch invoices", err);
      setInvoiceError(err);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchSubscription("student");
    loadInvoices();
  }, [fetchSubscription]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await api.post("user-subscriptions/upgrade");
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
      await api.post("user-subscriptions/cancel");
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

            {loadingSub ? (
              <p>Loading subscription...</p>
            ) : subscription ? (
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Plan:</span> {subscription.name}
                </p>
                <p>
                  <span className="font-medium">Start:</span>{" "}
                  {new Date(subscription.start_date).toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">End:</span>{" "}
                  {new Date(subscription.end_date).toLocaleDateString()}
                </p>
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className={`bg-yellow-500 px-4 py-2 rounded text-black font-medium hover:bg-yellow-600 ${
                      upgrading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Upgrade
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={canceling}
                    className={`bg-red-500 px-4 py-2 rounded text-white font-medium hover:bg-red-600 ${
                      canceling ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p>No active subscription.</p>
            )}

            <div>
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
                <ul className="list-disc list-inside space-y-1">
                  {invoices.map((inv) => (
                    <li key={inv.id}>
                      <a
                        href={inv.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Invoice {inv.id}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No invoices found.</p>
              )}
            </div>
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
