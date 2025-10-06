import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/services/api/api";
import useSubscriptionStore from "@/store/subscriptionStore";

export default function InstructorSettingsPage() {
  const subscription = useSubscriptionStore((state) => state.plan);
  const loadingSub = useSubscriptionStore((state) => state.loading);
  const fetchSubscription = useSubscriptionStore((state) => state.fetch);
  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoiceError, setInvoiceError] = useState(null);

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    setInvoiceError(null);
    try {
      const { data } = await api.get("invoices/instructor");
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
    fetchSubscription();
    loadInvoices();
  }, [fetchSubscription]);

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      await api.post("user-subscriptions/upgrade");
      await fetchSubscription();
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
      await fetchSubscription();
      toast.success("Subscription cancelled");
    } catch (err) {
      toast.error("Failed to cancel subscription");
      console.error("Cancel failed", err);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="p-6 max-w-2xl mx-auto text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-yellow-500">⚙️ Instructor Settings</h1>
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
                <button onClick={loadInvoices} className="text-blue-600 underline">
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
      </div>
    </InstructorLayout>
  );
}
