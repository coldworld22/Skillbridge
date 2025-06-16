import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import {
  fetchPlanById,
  updatePlan,
} from "@/services/admin/planService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";

export default function EditPlanPage() {
  const router = useRouter();
  const { id } = router.query;
  const { accessToken, user, hasHydrated } = useAuthStore();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || !hasHydrated) return;

    if (!accessToken || !user) {
      router.replace("/auth/login");
      return;
    }
    const role = user.role?.toLowerCase() ?? "";
    if (role !== "admin" && role !== "superadmin") {
      router.replace("/403");
      return;
    }

    const loadPlan = async () => {
      try {
        const data = await fetchPlanById(id);
        if (data) {
          setForm({
            name: data.name,
            priceMonthly: data.price_monthly,
            priceYearly: data.price_yearly,
            currency: data.currency,
            recommended: data.recommended,
            active: data.active,
          });
        }
      } catch (err) {
        toast.error("Failed to load plan");
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [accessToken, hasHydrated, id, router, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    try {
      await updatePlan(id, {
        name: form.name,
        price_monthly: Number(form.priceMonthly),
        price_yearly: Number(form.priceYearly),
        currency: form.currency,
        recommended: form.recommended,
        active: form.active,
      });
      toast.success("Plan updated");
      router.push("/dashboard/admin/plans");
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Failed to update plan");
    }
  };

  if (!hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <AdminLayout>
        <div className="p-6">Plan not found.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Edit ${form.name}`}>
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/admin/plans">
          <button className="flex items-center gap-2 text-gray-600 hover:text-black">
            <FaArrowLeft /> Back to Plans
          </button>
        </Link>
        <button
          onClick={handleSubmit}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaSave /> Update Plan
        </button>
      </div>

      <form className="bg-white rounded shadow p-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">Plan Name</label>
          <input
            className="w-full border px-4 py-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Monthly Price</label>
          <input
            type="number"
            className="w-full border px-4 py-2 rounded"
            value={form.priceMonthly}
            onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Yearly Price</label>
          <input
            type="number"
            className="w-full border px-4 py-2 rounded"
            value={form.priceYearly}
            onChange={(e) => setForm({ ...form, priceYearly: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Currency</label>
          <input
            className="w-full border px-4 py-2 rounded"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.recommended}
            onChange={(e) =>
              setForm({ ...form, recommended: e.target.checked })
            }
          />
          Recommended
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Active
        </label>
      </form>
    </AdminLayout>
  );
}
