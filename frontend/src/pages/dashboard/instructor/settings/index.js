import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useEffect } from "react";
import api from "@/services/api/api";
import useSubscriptionStore from "@/store/subscriptionStore";

export default function InstructorSettingsPage() {
  const subscription = useSubscriptionStore((state) => state.plan);
  const loadingSub = useSubscriptionStore((state) => state.loading);
  const fetchSubscription = useSubscriptionStore((state) => state.fetch);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleUpgrade = async () => {
    try {
      await api.post("/user-subscriptions/upgrade");
      await fetchSubscription();
    } catch (err) {
      console.error("Upgrade failed", err);
    }
  };

  const handleCancel = async () => {
    try {
      await api.post("/user-subscriptions/cancel");
      await fetchSubscription();
    } catch (err) {
      console.error("Cancel failed", err);
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
                  className="bg-yellow-500 px-4 py-2 rounded text-black font-medium hover:bg-yellow-600"
                >
                  Upgrade
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-red-500 px-4 py-2 rounded text-white font-medium hover:bg-red-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p>No active subscription.</p>
          )}
        </div>
      </div>
    </InstructorLayout>
  );
}
