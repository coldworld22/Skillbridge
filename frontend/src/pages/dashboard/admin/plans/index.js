import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from "react-icons/fa";
import Link from "next/link";
import { fetchPlans, deletePlan, updatePlan } from "@/services/admin/planService";
import useAuthStore from "@/store/auth/authStore";
import { toast } from "react-toastify";
import { useTranslation } from "next-i18next";

export default function PlansIndex() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const { t } = useTranslation('dashboard', { keyPrefix: 'plansPage' });

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
      router.replace("/error/403");
      return;
    }

    const loadPlans = async () => {
      try {
        const data = await fetchPlans();
        setPlans(data);
      } catch (err) {
        console.error("Failed to load plans", err);
        toast.error(t('failed_to_load'));
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
      toast.success(t('plan_updated'));
    } catch (err) {
      console.error("Toggle failed", err);
      toast.error(t('failed_to_update'));
    }
  };

  const removePlan = async (id) => {
    if (!confirm(t('confirm_delete_plan'))) return;
    try {
      await deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success(t('plan_deleted'));
    } catch (err) {
      console.error("Delete plan failed", err);
      toast.error(t('failed_to_delete'));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(plans.map((p) => p.id));
  const clearAll = () => setSelectedIds([]);

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(t('confirm_delete_selected'))) return;
    try {
      await Promise.all(selectedIds.map((id) => deletePlan(id)));
      setPlans((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast.success(t('plan_deleted'));
    } catch (err) {
      console.error("Bulk delete failed", err);
      toast.error(t('failed_to_delete'));
    }
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-lg">{t('loading')}</p>
      </div>
    );
  }

  return (
    <AdminLayout title={t('title')}>
      <div className="bg-white rounded-xl p-6 shadow mb-10">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <input
              type="checkbox"
              onChange={(e) => (e.target.checked ? selectAll() : clearAll())}
              checked={selectedIds.length === plans.length && plans.length > 0}
            />
            <span>📦 {t('title')}</span>
          </h1>
          <Link href="/dashboard/admin/plans/create">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow">
              <FaPlus /> {t('add_plan')}
            </button>
          </Link>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex justify-between items-center bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
            <span>{selectedIds.length} {t('selected')}</span>
            <div className="flex gap-2">
              <button onClick={bulkDelete} className="bg-red-600 text-white px-3 py-1 rounded text-sm">{t('delete_selected')}</button>
              <button onClick={clearAll} className="text-sm text-gray-500 hover:text-black">{t('clear_selection')}</button>
            </div>
          </div>
        )}
        {loading ? (
          <p>{t('loading')}</p>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => {
              let styleConf = null;
              if (plan.style) {
                try {
                  styleConf = JSON.parse(plan.style);
                } catch {
                  styleConf = null;
                }
              }
              const styleObj = {
                backgroundColor: plan.color || "transparent",
              };
              if (styleConf) {
                if (styleConf.gradientStart && styleConf.gradientEnd) {
                  styleObj.background = `linear-gradient(90deg, ${styleConf.gradientStart}, ${styleConf.gradientEnd})`;
                }
                if (styleConf.textColor) styleObj.color = styleConf.textColor;
                if (styleConf.textSize) styleObj.fontSize = `${styleConf.textSize}px`;
              }
              return (
                <div
                  key={plan.id}
                  className={`border rounded p-4 flex justify-between items-center ${selectedIds.includes(plan.id) ? 'ring-2 ring-blue-500' : ''}`}
                  style={styleObj}
                >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={selectedIds.includes(plan.id)}
                    onChange={() => toggleSelect(plan.id)}
                  />
                  <span
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: plan.color || "#1f2937" }}
                  ></span>
                  <div>
                    <h2 className="font-bold text-lg">{plan.name}</h2>
                    <p className="text-sm text-gray-600">
                      {t('monthly_price_label', { price: plan.price_monthly, currency: plan.currency })} | {t('yearly_price_label', { price: plan.price_yearly, currency: plan.currency })}
                    </p>
                  </div>
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
                      <FaEdit /> {t('edit')}
                    </button>
                  </Link>
                  <button
                    onClick={() => removePlan(plan.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1"
                  >
                    <FaTrash /> {t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
