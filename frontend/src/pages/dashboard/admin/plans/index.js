import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import Link from "next/link";
import { fetchPlans, deletePlan, updatePlan } from "@/services/admin/planService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";

export default function PlansIndex() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { accessToken, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!accessToken || !user) {
      router.replace("/auth/login");
      return;
    }

    const role = user.role?.toLowerCase() ?? "";
    if (role !== "admin" && role !== "superadmin") {
      router.replace("/403");
      return;
    }

    const loadPlans = async () => {
      try {
        const data = await fetchPlans();
        setPlans(data);
      } catch (err) {
        console.error("Failed to load plans", err);
        toast.error("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [accessToken, hasHydrated, router, user]);

  const toggleActive = async (id) => {
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;
    try {
      await updatePlan(id, { active: !plan.active });
      setPlans((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
      );
      toast.success("Plan updated");
    } catch (err) {
      console.error("Toggle failed", err);
      toast.error("Failed to update plan");
    }
  };

  const removePlan = async (id) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      await deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success("Plan deleted");
    } catch (err) {
      console.error("Delete plan failed", err);
      toast.error("Failed to delete plan");
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <AdminLayout title="Manage Subscription Plans">
      <div className="bg-white rounded-xl p-6 shadow mb-10">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📦 Subscription Plans</h1>
          <Link href="/dashboard/admin/plans/create">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow">
              <FaPlus /> Add Plan
            </button>
          </Link>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="border rounded p-4 flex justify-between items-center"
              >
                <div>
                  <h2 className="font-bold text-lg">{plan.name}</h2>
                  <p className="text-sm text-gray-600">
                    Monthly: {plan.price_monthly} {plan.currency} | Yearly: {plan.price_yearly} {plan.currency}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(plan.id)}
                    className="px-3 py-1 rounded text-white bg-gray-600 hover:opacity-80"
                  >
                    {plan.active ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                  <Link href={`/dashboard/admin/plans/edit/${plan.id}`}>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1">
                      <FaEdit /> Edit
                    </button>
                  </Link>
                  <button
                    onClick={() => removePlan(plan.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
