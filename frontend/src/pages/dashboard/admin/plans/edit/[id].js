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
import { useTranslation } from "next-i18next";

export default function EditPlanPage() {
  const router = useRouter();
  const { t } = useTranslation('dashboard', { keyPrefix: 'plansPage' });
  const { id } = router.query;
  const { accessToken, user, hasHydrated } = useAuthStore();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
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
    if (!router.isReady || !hasHydrated) return;

    if (!accessToken || !user) {
      router.replace("/auth/login");
      return;
    }
    const role = user.role?.toLowerCase() ?? "";
    if (role !== "admin" && role !== "superadmin") {
      router.replace("/error/403");
      return;
    }

    const loadPlan = async () => {
      try {
        const data = await fetchPlanById(id);
        if (data) {
          let styleConf = {
            textColor: "#ffffff",
            buttonColor: "#111827",
            buttonTextColor: "#ffffff",
            textSize: 16,
            gradientStart: "",
            gradientEnd: "",
          };
          if (data.style) {
            try {
              styleConf = { ...styleConf, ...JSON.parse(data.style) };
            } catch {
              // ignore invalid style format
            }
          }
          setForm({
            name: data.name,
            priceMonthly: data.price_monthly,
            priceYearly: data.price_yearly,
            currency: data.currency,
            color: data.color || "#1F2937",
            textColor: styleConf.textColor,
            buttonColor: styleConf.buttonColor,
            buttonTextColor: styleConf.buttonTextColor,
            textSize: styleConf.textSize,
            gradientStart: styleConf.gradientStart,
            gradientEnd: styleConf.gradientEnd,
            recommended: data.recommended,
            active: data.active,
            target_role: data.target_role || 'student',
            maxCourses: data.max_courses || 0,
            adCredits: data.ad_credits || 0,
          });
          setFeatures(data.features || []);
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
    const isHex = (val) => /^#([0-9A-F]{3}){1,2}$/i.test(val);

    if (!form.name.trim()) {
      toast.error(t('name_required'));
      return;
    }
    if (!isHex(form.color) || !isHex(form.textColor) ||
        !isHex(form.buttonColor) || !isHex(form.buttonTextColor)) {
      toast.error(t('invalid_color'));
      return;
    }
    if (form.gradientStart && !isHex(form.gradientStart)) {
      toast.error(t('invalid_gradient_start'));
      return;
    }
    if (form.gradientEnd && !isHex(form.gradientEnd)) {
      toast.error(t('invalid_gradient_end'));
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
      await updatePlan(id, {
        name: form.name,
        price_monthly: Number(form.priceMonthly),
        price_yearly: Number(form.priceYearly),
        currency: form.currency,
        target_role: form.target_role,
        color: form.color,
        style: JSON.stringify(style),
        recommended: form.recommended,
        active: form.active,
        max_courses:
          form.target_role === 'instructor'
            ? Number(form.maxCourses || 0)
            : undefined,
        ad_credits:
          form.target_role === 'instructor'
            ? Number(form.adCredits || 0)
            : undefined,
        features: features.filter(
          (f) => f.feature_key || f.value || f.description
        ),
      });
      toast.success(t('plan_updated'));
      router.push("/dashboard/admin/plans");
    } catch (err) {
      console.error("Update failed", err);
      toast.error(t('failed_to_update'));
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
        <div className="p-6">{t('plan_not_found')}</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`${t('update_plan')}: ${form.name}`}>
      <div className="flex justify-between items-center mb-6">
        <Link href="/dashboard/admin/plans">
          <button className="flex items-center gap-2 text-gray-600 hover:text-black">
            <FaArrowLeft /> {t('back_to_plans')}
          </button>
        </Link>
        <button
          onClick={handleSubmit}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaSave /> {t('update_plan')}
        </button>
      </div>

      <form className="bg-white rounded shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1">{t('plan_name')}</label>
          <input
            className="w-full border px-4 py-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('monthly_price')}</label>
          <input
            type="number"
            className="w-full border px-4 py-2 rounded"
            value={form.priceMonthly}
            onChange={(e) => setForm({ ...form, priceMonthly: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('yearly_price')}</label>
          <input
            type="number"
            className="w-full border px-4 py-2 rounded"
            value={form.priceYearly}
            onChange={(e) => setForm({ ...form, priceYearly: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('currency')}</label>
          <input
            className="w-full border px-4 py-2 rounded"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('target_role')}</label>
          <select
            className="w-full border px-4 py-2 rounded"
            value={form.target_role}
            onChange={(e) => setForm({ ...form, target_role: e.target.value })}
          >
            <option value="student">{t('student')}</option>
            <option value="instructor">{t('instructor')}</option>
          </select>
        </div>
        {form.target_role === 'instructor' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">{t('max_courses', 'Max Courses')}</label>
              <input
                type="number"
                className="w-full border px-4 py-2 rounded"
                value={form.maxCourses}
                onChange={(e) => setForm({ ...form, maxCourses: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('ad_credits', 'Ad Credits')}</label>
              <input
                type="number"
                className="w-full border px-4 py-2 rounded"
                value={form.adCredits}
                onChange={(e) => setForm({ ...form, adCredits: e.target.value })}
              />
            </div>
          </>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">{t('plan_color')}</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('text_color')}</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.textColor}
            onChange={(e) => setForm({ ...form, textColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('button_color')}</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.buttonColor}
            onChange={(e) => setForm({ ...form, buttonColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('button_text_color')}</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.buttonTextColor}
            onChange={(e) => setForm({ ...form, buttonTextColor: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('font_size')}</label>
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
          <label className="block text-sm font-medium mb-1">{t('gradient_start')}</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.gradientStart}
            onChange={(e) => setForm({ ...form, gradientStart: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('gradient_end')}</label>
          <input
            type="color"
            className="w-full border px-4 py-2 rounded"
            value={form.gradientEnd}
            onChange={(e) => setForm({ ...form, gradientEnd: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <h4 className="font-semibold mb-2">{t('plan_features')}</h4>
          {features.map((feat, idx) => (
            <div key={idx} className="grid grid-cols-3 gap-2 mb-2 items-center">
              <input
                className="border px-2 py-1 rounded"
                placeholder={t('key')}
                value={feat.feature_key}
                onChange={(e) =>
                  updateFeature(idx, "feature_key", e.target.value)
                }
              />
              <input
                className="border px-2 py-1 rounded"
                placeholder={t('value')}
                value={feat.value}
                onChange={(e) => updateFeature(idx, "value", e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  className="border px-2 py-1 rounded flex-1"
                  placeholder={t('description')}
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
                  {t('remove')}
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="mt-2 bg-gray-200 px-3 py-1 rounded text-sm"
          >
            {t('add_feature')}
          </button>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.recommended}
            onChange={(e) =>
              setForm({ ...form, recommended: e.target.checked })
            }
          />
          {t('recommended')}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          {t('active')}
        </label>
      </form>
    </AdminLayout>
  );
}
