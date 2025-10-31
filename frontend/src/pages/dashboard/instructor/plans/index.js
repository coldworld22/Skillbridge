import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { fetchPublicPlans } from "@/services/public/planService";
import { fetchSubscriptionSummary } from "@/services/subscriptionService";
import useAuthStore from "@/store/auth/authStore";
import { formatCurrency } from "@/utils/currency";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const formatDate = (value, locale = "en") => {
  if (!value) return "—";
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
    });
    return formatter.format(new Date(value));
  } catch (_err) {
    return new Date(value).toLocaleDateString?.() || "—";
  }
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString() : value;
};

const PlanMetric = ({ label, value, helper }) => (
  <div className="rounded-xl bg-slate-900 text-slate-100 px-5 py-4 shadow-inner border border-slate-800">
    <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">{label}</p>
    <p className="text-2xl font-semibold text-white">{value}</p>
    {helper && (
      <p className="text-xs text-slate-400 mt-1">{helper}</p>
    )}
  </div>
);

export default function InstructorPlansPage() {
  const { t, i18n } = useTranslation("dashboard", {
    keyPrefix: "instructorPlansPage",
  });
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);
  const [billingInterval, setBillingInterval] = useState("monthly");

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const data = await fetchPublicPlans("instructor");
      setPlans(Array.isArray(data) ? data.filter((plan) => plan.active) : []);
    } catch (err) {
      console.error("Failed to load instructor plans", err);
      setPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await fetchSubscriptionSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch subscription summary", err);
      setSummary(null);
      setSummaryError(err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
    loadSummary();
  }, [loadPlans, loadSummary]);

  const currentPlanId = useMemo(() => {
    if (summary?.subscription?.plan_id) return summary.subscription.plan_id;
    if (user?.plan_id) return user.plan_id;
    if (typeof user?.plan === "object" && user.plan?.id) return user.plan.id;
    return null;
  }, [summary?.subscription?.plan_id, user?.plan_id, user?.plan]);

  const metrics = useMemo(() => {
    if (!summary) return [];
    const usage = summary?.usage || {};
    const helpers = [];

    if (usage) {
      helpers.push({
        key: "activeAds",
        label: t("metrics_active_ads"),
        value: formatNumber(usage.active_ads ?? 0),
        helper:
          usage.max_active_ads !== null && usage.max_active_ads !== undefined
            ? t("metrics_active_ads_helper", {
                current: formatNumber(usage.active_ads ?? 0),
                total: formatNumber(usage.max_active_ads),
              })
            : t("metrics_active_ads_unlimited"),
      });

      helpers.push({
        key: "classes",
        label: t("metrics_classes"),
        value: formatNumber(usage.published_classes ?? 0),
        helper:
          usage.max_active_classes !== null &&
          usage.max_active_classes !== undefined
            ? t("metrics_classes_helper", {
                current: formatNumber(usage.published_classes ?? 0),
                remaining: formatNumber(
                  usage.remaining_class_slots ?? 0
                ),
              })
            : t("metrics_classes_unlimited"),
      });

      helpers.push({
        key: "adCredits",
        label: t("metrics_ad_credits"),
        value:
          usage.ad_credits_remaining === null ||
          usage.ad_credits_remaining === undefined
            ? t("metrics_ad_credits_unlimited")
            : formatNumber(usage.ad_credits_remaining),
        helper:
          usage.ad_credits_remaining === null ||
          usage.ad_credits_remaining === undefined
            ? undefined
            : t("metrics_ad_credits_helper", {
                remaining: formatNumber(usage.ad_credits_remaining),
                total: formatNumber(usage.ad_credits_total ?? 0),
              }),
      });

      helpers.push({
        key: "adDuration",
        label: t("metrics_ad_duration"),
        value:
          usage.max_ad_duration_days === null ||
          usage.max_ad_duration_days === undefined
            ? t("metrics_ad_duration_unlimited")
            : t("metrics_ad_duration_value", {
                days: formatNumber(usage.max_ad_duration_days),
              }),
        helper:
          usage.allow_branding
            ? t("metrics_branding_enabled")
            : t("metrics_branding_disabled"),
      });
    }

    return helpers;
  }, [summary, t]);

  const handleSubscribe = (planId) => {
    const query = new URLSearchParams({
      itemType: "plan",
      itemId: planId,
      interval: billingInterval,
    });
    router.push(`/payments/checkout?${query.toString()}`);
  };

  const renderPlanPrice = (plan) => {
    const amount =
      billingInterval === "monthly"
        ? plan.price_monthly
        : plan.price_yearly;
    if (amount === null || amount === undefined) return "—";
    return formatCurrency(amount, { currency: plan.currency }) +
      (billingInterval === "monthly" ? "/mo" : "/yr");
  };

  const renderCurrentPlanSummary = () => {
    if (summaryLoading) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-300">
          {t("loading_summary")}
        </div>
      );
    }

    if (summaryError) {
      return (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 text-amber-200 space-y-3">
          <p>{t("summary_error")}</p>
          <button
            onClick={loadSummary}
            className="px-3 py-2 rounded bg-amber-400 text-slate-900 font-semibold hover:bg-amber-300"
          >
            {t("retry")}
          </button>
        </div>
      );
    }

    if (!summary) {
      return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-200">
          <h2 className="text-xl font-semibold text-white mb-2">
            {t("no_plan_heading")}
          </h2>
          <p className="text-sm text-slate-300">
            {t("no_plan_body")}
          </p>
        </div>
      );
    }

    const plan = summary.plan;
    const subscription = summary.subscription;

    return (
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 lg:p-8 shadow-xl text-slate-100 space-y-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-400 mb-1">
              {t("current_plan_badge")}
            </p>
            <h2 className="text-2xl font-bold text-white">
              {plan?.name || t("current_plan_heading")}
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              {t("current_plan_dates", {
                start: formatDate(subscription?.start_date, i18n.language),
                end: formatDate(subscription?.end_date, i18n.language),
              })}
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/instructor/settings")}
            className="bg-emerald-500 text-slate-900 font-semibold px-4 py-2 rounded-lg hover:bg-emerald-400"
          >
            {t("manage_plan")}
          </button>
        </div>

        {metrics.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <PlanMetric
                key={metric.key}
                label={metric.label}
                value={metric.value}
                helper={metric.helper}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <InstructorLayout>
      <div className="space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("subtitle")}
          </p>
        </header>

        {renderCurrentPlanSummary()}

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {t("choose_plan_heading")}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t("choose_plan_subtitle")}
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
              <button
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  billingInterval === "monthly"
                    ? "bg-emerald-500 text-white"
                    : "bg-transparent text-slate-600 dark:text-slate-300"
                }`}
                onClick={() => setBillingInterval("monthly")}
              >
                {t("monthly_label")}
              </button>
              <button
                className={`px-4 py-2 text-sm font-semibold transition-colors ${
                  billingInterval === "yearly"
                    ? "bg-emerald-500 text-white"
                    : "bg-transparent text-slate-600 dark:text-slate-300"
                }`}
                onClick={() => setBillingInterval("yearly")}
              >
                {t("yearly_label")}
              </button>
            </div>
          </div>

          {plansLoading ? (
            <p className="text-slate-500 dark:text-slate-300">
              {t("loading_plans")}
            </p>
          ) : plans.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-300">
              {t("no_plans")}
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent =
                  currentPlanId && String(plan.id) === String(currentPlanId);
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl border p-6 flex flex-col h-full transition-shadow ${
                      isCurrent
                        ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {plan.recommended && (
                      <span className="absolute -top-3 right-4 bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow">
                        {t("badge_most_popular")}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="absolute -top-3 left-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                        {t("current_plan_badge")}
                      </span>
                    )}

                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-300 mb-4">
                      {renderPlanPrice(plan)}
                    </p>

                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 flex-1">
                      <li>
                        {plan.max_courses === null
                          ? t("plan_max_courses_unlimited")
                          : t("plan_max_courses", {
                              count: formatNumber(plan.max_courses),
                            })}
                      </li>
                      <li>
                        {plan.ad_credits === null
                          ? t("plan_ad_credits_unlimited")
                          : t("plan_ad_credits", {
                              count: formatNumber(plan.ad_credits ?? 0),
                            })}
                      </li>
                    </ul>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCurrent}
                      className={`mt-6 w-full rounded-lg px-4 py-2 font-semibold transition-colors ${
                        isCurrent
                          ? "bg-slate-400/30 text-slate-600 cursor-not-allowed"
                          : "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                      }`}
                    >
                      {isCurrent
                        ? t("current_plan_button")
                        : t("select_plan_button")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </InstructorLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
