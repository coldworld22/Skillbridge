import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaSave, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";
import { createPlan } from "@/services/admin/planService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";

export default function CreatePlanPage() {
  const router = useRouter();
  const { t } = useTranslation('dashboard', { keyPrefix: 'plansPage' });
  const { accessToken, user, hasHydrated } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    priceMonthly: 0,
    priceYearly: 0,
    currency: "USD",
    color: "#1F2937",
    textColor: "#ffffff",
    buttonColor: "#111827",
    buttonTextColor: "#ffffff",
    textSize: 16,
    gradientStart: "",
    gradientEnd: "",
    recommended: false,
    active: true,
  });

  const [features, setFeatures] = useState([]);

  const addFeature = () =>
    setFeatures([...features, { feature_key: "", value: "", description: "" }]);

  const updateFeature = (index, field, value) => {
    const updated = [...features];
    updated[index][field] = value;
    setFeatures(updated);
  };

  const removeFeature = (index) =>
    setFeatures(features.filter((_, i) => i !== index));

  useEffect(() => {
    if (!hasHydrated) return;
    if (!accessToken || !user) {
      router.replace("/auth/login");
      return;
    }
    const role = user.role?.toLowerCase() ?? "";
    if (role !== "admin" && role !== "superadmin") {
      router.replace("/error/403");
    }
  }, [accessToken, hasHydrated, router, user]);

  const isHex = (val) => /^#([0-9A-F]{3}){1,2}$/i.test(val);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!isHex(form.color) || !isHex(form.textColor) ||
        !isHex(form.buttonColor) || !isHex(form.buttonTextColor)) {
      toast.error("Invalid color value");
      return;
    }
    if (form.gradientStart && !isHex(form.gradientStart)) {
      toast.error("Invalid gradient start color");
      return;
    }
    if (form.gradientEnd && !isHex(form.gradientEnd)) {
      toast.error("Invalid gradient end color");
      return;
    }

    const style = {
      textColor: form.textColor,
      buttonColor: form.buttonColor,
      buttonTextColor: form.buttonTextColor,
      textSize: Number(form.textSize) || 16,
      gradientStart: form.gradientStart || null,
      gradientEnd: form.gradientEnd || null,
    };

    try {
      await createPlan({
        name: form.name,
        price_monthly: Number(form.priceMonthly),
        price_yearly: Number(form.priceYearly),
        currency: form.currency,
        color: form.color,
        style: JSON.stringify(style),
        recommended: form.recommended,
        active: form.active,
        features: features.filter(
          (f) => f.feature_key || f.value || f.description
        ),
      });
      toast.success(t('plan_created'));
      router.push("/dashboard/admin/plans");
    } catch (err) {
      console.error("Create failed", err);
      toast.error(t('failed_to_create'));
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
    <AdminLayout title={t('title')}>
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/admin/plans">
          <button className="flex items-center gap-2 text-gray-600 hover:text-black">
            <FaArrowLeft /> {t('back_to_plans')}
          </button>
        </Link>
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaSave /> {t('save_plan')}
        </button>
      </div>

      <form className="bg-white rounded shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
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
        <div>
          <label className="block text-sm font-medium mb-1">Plan Color</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Text Color</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.textColor}
            onChange={(e) => setForm({ ...form, textColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Button Color</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.buttonColor}
            onChange={(e) => setForm({ ...form, buttonColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Button Text Color</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.buttonTextColor}
            onChange={(e) => setForm({ ...form, buttonTextColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Font Size (px)</label>
          <input
            type="number"
            className="w-full border px-4 py-2 rounded"
            value={form.textSize}
            min={10}
            max={40}
            onChange={(e) => setForm({ ...form, textSize: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gradient Start</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.gradientStart}
            onChange={(e) => setForm({ ...form, gradientStart: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Gradient End</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.gradientEnd}
            onChange={(e) => setForm({ ...form, gradientEnd: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold mb-2">Plan Features</h4>
          {features.map((feat, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2 mb-2 items-center">
              <input
                className="border px-2 py-1 rounded"
                placeholder="Key"
                value={feat.feature_key}
                onChange={(e) =>
                  updateFeature(idx, "feature_key", e.target.value)
                }
              />
              <input
                className="border px-2 py-1 rounded"
                placeholder="Value"
                value={feat.value}
                onChange={(e) => updateFeature(idx, "value", e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="border px-2 py-1 rounded flex-1"
                  placeholder="Description"
                  value={feat.description}
                  onChange={(e) =>
                    updateFeature(idx, "description", e.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => removeFeature(idx)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="mt-2 bg-gray-200 px-3 py-1 rounded text-sm"
          >
            + Add Feature
          </button>
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
