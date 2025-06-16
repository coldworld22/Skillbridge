import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { createPlan } from "@/services/admin/planService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";

export default function CreatePlanPage() {
  const router = useRouter();
  const { accessToken, user, hasHydrated } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    recommended: false,
    active: true,
  });

  useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken || !user) {
      router.replace("/auth/login");
      return;
    }
    const role = user.role?.toLowerCase() ?? "";
    if (role !== "admin" && role !== "superadmin") {
      router.replace("/403");
    }
  }, [accessToken, hasHydrated, router, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPlan({
        name: form.name,
        price_monthly: Number(form.priceMonthly),
        price_yearly: Number(form.priceYearly),
        currency: form.currency,
        recommended: form.recommended,
        active: form.active,
        features: [],
      });
      toast.success("Plan created");
      router.push("/dashboard/admin/plans");
    } catch (err) {
      console.error("Create failed", err);
      toast.error("Failed to create plan");
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
    <AdminLayout title="Create New Plan">
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/admin/plans">
          <button className="flex items-center gap-2 text-gray-600 hover:text-black">
            <FaArrowLeft /> Back to Plans
          </button>
        </Link>
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaSave /> Save Plan
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
            onChange={(e) => setForm({ ...form, recommended: e.target.checked })}
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
