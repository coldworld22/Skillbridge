import Link from "next/link";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import api from "@/services/api/api";
import {
  fetchSubscriptionSummary,
  fetchSubscriptionHistory,
} from "@/services/subscriptionService";
import {
  fetchInstructorBillingPayments,
  fetchInstructorPaymentSummary,
} from "@/services/instructor/paymentService";
import {
  downloadInvoice,
  fetchInvoiceByPaymentId,
} from "@/services/instructor/invoiceService";
import { formatCurrency } from "@/utils/currency";
import { formatDate } from "@/utils/date";
import { fetchPublicPlans } from "@/services/public/planService";
import {
  findUpgradeTargetPlan,
  planRequiresPayment,
  pickDefaultInterval,
} from "@/utils/plans/upgradeHelpers";
import {
  FaArrowRight,
  FaDownload,
  FaFileInvoice,
  FaRegClock,
} from "react-icons/fa";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

const STATUS_STYLES = {
  paid: "bg-green-100 text-green-700",
  awaiting_approval: "bg-yellow-100 text-yellow-700",
  pending_payment: "bg-yellow-100 text-yellow-700",
  rejected: "bg-red-100 text-red-600",
  cancelled: "bg-gray-200 text-gray-600",
  expired: "bg-gray-200 text-gray-600",
  active: "bg-emerald-100 text-emerald-700",
};

const DEFAULT_CURRENCY = "USD";

const fallbackNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function InstructorBillingPage() {
  const { t } = useTranslation("dashboard", {
    keyPrefix: "instructorBillingPage",
  });
  const router = useRouter();

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [invoicesError, setInvoicesError] = useState(null);

  const [walletSummary, setWalletSummary] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState(null);

  const [availablePlans, setAvailablePlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);

  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const activeSubscription = summary?.subscription || null;
  const activePlan = summary?.plan || null;
  const usage = summary?.usage || {};
  const planRole = useMemo(() => {
    const role = activeSubscription?.role;
    if (role) return String(role).toLowerCase();
    const slug = String(activePlan?.slug || "").toLowerCase();
    if (slug.includes("student")) return "student";
    return "instructor";
  }, [activeSubscription?.role, activePlan?.slug]);

  const upgradeButtonLabel = useMemo(() => {
    if (upgrading) return t("actions.upgrading");
    if (plansLoading) return t("loading");
    return t("actions.upgrade");
  }, [upgrading, plansLoading, t]);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const data = await fetchSubscriptionSummary();
      setSummary(data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setSummary(null);
        return;
      }
      console.error("Failed to load subscription summary", err);
      setSummaryError(err);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await fetchSubscriptionHistory();
      setSubscriptionHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load subscription history", err);
      setSubscriptionHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const data = await fetchInstructorBillingPayments({
        sortDirection: "desc",
      });
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load billing payments", err);
      setPaymentsError(err);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    setInvoicesError(null);
    try {
      const { data } = await api.get("/invoices/instructor");
      setInvoices(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Failed to load invoices", err);
      setInvoicesError(err);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const loadWalletSummary = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const data = await fetchInstructorPaymentSummary();
      setWalletSummary(data || null);
    } catch (err) {
      console.error("Failed to load wallet summary", err);
      setWalletError(err);
      setWalletSummary(null);
    } finally {
      setWalletLoading(false);
    }
  }, []);

  const loadAvailablePlans = useCallback(
    async (role) => {
      if (!role) return [];
      setPlansLoading(true);
      setPlansError(null);
      try {
        const data = await fetchPublicPlans(role);
        const normalized = Array.isArray(data) ? data : [];
        setAvailablePlans(normalized);
        return normalized;
      } catch (err) {
        console.error("Failed to load available plans", err);
        setPlansError(err);
        setAvailablePlans([]);
        return [];
      } finally {
        setPlansLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        loadSummary(),
        loadHistory(),
        loadPayments(),
        loadInvoices(),
        loadWalletSummary(),
      ]);
    };
    loadAll();
  }, [loadSummary, loadHistory, loadPayments, loadInvoices, loadWalletSummary]);

  useEffect(() => {
    if (!planRole) return;
    if (availablePlans.length > 0 || plansLoading || plansError) return;
    loadAvailablePlans(planRole);
  }, [planRole, availablePlans, plansLoading, plansError, loadAvailablePlans]);

  const handleUpgrade = async () => {
    const role = planRole || "instructor";
    let plans = availablePlans;
    if (plans.length === 0 && !plansLoading) {
      plans = await loadAvailablePlans(role);
    }

    const targetPlan =
      plans.length > 0 ? findUpgradeTargetPlan(plans, activePlan) : null;

    if (!targetPlan) {
      toast.info(t("messages.upgrade_unavailable"));
      if (role === "instructor") {
        router.push("/dashboard/instructor/plans");
      } else {
        router.push("/plans");
      }
      return;
    }

    if (planRequiresPayment(targetPlan)) {
      const interval = pickDefaultInterval(targetPlan);
      const query = new URLSearchParams({
        itemType: "plan",
        itemId: targetPlan.id,
        interval,
      });
      router.push(`/payments/checkout?${query.toString()}`);
      return;
    }

    setUpgrading(true);
    try {
      await api.post("/user-subscriptions", {
        plan_id: targetPlan.id,
        interval: pickDefaultInterval(targetPlan),
      });
      toast.success(t("messages.upgrade_success"));
      await Promise.all([
        loadSummary(),
        loadHistory(),
        loadPayments(),
        loadWalletSummary(),
      ]);
      await loadAvailablePlans(role);
    } catch (err) {
      console.error("Upgrade failed", err);
      toast.error(t("messages.upgrade_failed"));
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await api.post("/user-subscriptions/cancel");
      toast.success(t("messages.cancel_success"));
      await Promise.all([
        loadSummary(),
        loadHistory(),
        loadPayments(),
        loadWalletSummary(),
      ]);
    } catch (err) {
      console.error("Cancel failed", err);
      toast.error(t("messages.cancel_failed"));
    } finally {
      setCanceling(false);
    }
  };

  const handleDownloadInvoice = async (payment) => {
    if (!payment) return;
    try {
      if (payment.invoice_id) {
        await downloadInvoice(payment.invoice_id);
        return;
      }
      if (payment.invoice_pdf_url) {
        window.open(payment.invoice_pdf_url, "_blank", "noopener");
        return;
      }
      const invoice = await fetchInvoiceByPaymentId(payment.id);
      if (invoice?.id) {
        await downloadInvoice(invoice.id);
        return;
      }
      toast.error(t("messages.invoice_not_found"));
    } catch (err) {
      console.error("Failed to download invoice", err);
      toast.error(t("messages.invoice_download_failed"));
    }
  };

  const planIntervalLabel = useMemo(() => {
    if (!activeSubscription) return t("labels.interval_unknown");
    if (activeSubscription.interval) {
      const normalized = String(activeSubscription.interval).toLowerCase();
      if (normalized === "monthly") return t("labels.interval_monthly");
      if (normalized === "yearly") return t("labels.interval_yearly");
    }
    if (activeSubscription.start_date && activeSubscription.end_date) {
      const start = new Date(activeSubscription.start_date);
      const end = new Date(activeSubscription.end_date);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const diff = end.getTime() - start.getTime();
        const days = Math.round(diff / (1000 * 60 * 60 * 24));
        if (days >= 335) return t("labels.interval_yearly");
        if (days >= 27 && days <= 62) return t("labels.interval_monthly");
      }
    }
    return t("labels.interval_unknown");
  }, [activeSubscription, t]);

  const paymentStatusLabels = useMemo(
    () => ({
      paid: t("statusLabels.paid"),
      awaiting_approval: t("statusLabels.awaiting_approval"),
      pending_payment: t("statusLabels.pending_payment"),
      rejected: t("statusLabels.rejected"),
    }),
    [t]
  );

  const paymentTypeLabels = useMemo(
    () => ({
      plan: t("paymentTypes.plan"),
      class: t("paymentTypes.class"),
      tutorial: t("paymentTypes.tutorial"),
      book: t("paymentTypes.book"),
      subscription: t("paymentTypes.plan"),
      other: t("paymentTypes.other"),
    }),
    [t]
  );

  const subscriptionStatusLabels = useMemo(
    () => ({
      active: t("statusLabels.active"),
      expired: t("statusLabels.expired"),
      cancelled: t("statusLabels.cancelled"),
    }),
    [t]
  );

  const walletAmountDisplay = useMemo(() => {
    if (walletLoading) return "...";
    const amount =
      walletSummary?.availableForWithdrawal ??
      walletSummary?.walletBalance ??
      0;
    return formatCurrency(amount, {
      currency: activePlan?.currency || DEFAULT_CURRENCY,
    });
  }, [walletLoading, walletSummary, activePlan]);

  const upgradeTarget = useMemo(
    () => findUpgradeTargetPlan(availablePlans, activePlan),
    [availablePlans, activePlan]
  );

  const isOnHighestPlan = useMemo(
    () => !plansLoading && availablePlans.length > 0 && !upgradeTarget,
    [plansLoading, availablePlans.length, upgradeTarget]
  );

  return (
    <InstructorLayout>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto text-gray-800 space-y-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-yellow-500">
            {t("title")}
          </h1>
          <p className="text-gray-500">{t("subtitle")}</p>
        </header>

        <section className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FaFileInvoice className="text-yellow-500" />
                {t("activePlan.heading")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("activePlan.caption")}
              </p>
            </div>
            <Link
              href="/plans"
              className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-600 hover:text-yellow-700"
            >
              {t("actions.view_plans")}
              <FaArrowRight />
            </Link>
          </div>

          {summaryLoading ? (
            <p className="text-sm text-gray-500">{t("loading")}</p>
          ) : summaryError ? (
            <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
              {t("messages.summary_error")}
            </div>
          ) : activeSubscription && activePlan ? (
            <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
              <div className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    {t("activePlan.plan_label")}
                  </p>
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {activePlan.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t("activePlan.interval", { value: planIntervalLabel })}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-gray-400 uppercase text-xs">
                      {t("activePlan.start_date")}
                    </dt>
                    <dd className="font-medium text-gray-800">
                      {formatDate(activeSubscription.start_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 uppercase text-xs">
                      {t("activePlan.end_date")}
                    </dt>
                    <dd className="font-medium text-gray-800">
                      {formatDate(activeSubscription.end_date)}
                    </dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={upgrading || plansLoading}
                    className={`px-4 py-2 rounded-lg font-medium text-sm bg-yellow-500 text-black hover:bg-yellow-600 transition ${
                      upgrading || plansLoading
                        ? "opacity-60 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {upgradeButtonLabel}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={canceling}
                    className={`px-4 py-2 rounded-lg font-medium text-sm border border-red-400 text-red-500 hover:bg-red-50 transition ${
                      canceling ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    {canceling ? t("actions.canceling") : t("actions.cancel")}
                  </button>
                </div>
                {(isOnHighestPlan || plansError) && (
                  <p
                    className={`text-xs ${
                      plansError ? "text-red-500" : "text-gray-500"
                    }`}
                  >
                    {plansError
                      ? t("messages.upgrade_options_error")
                      : t("messages.upgrade_unavailable")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    {t("usage.ads")}
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {fallbackNumber(usage.active_ads) ?? 0}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      /{" "}
                      {usage.max_active_ads !== null &&
                      usage.max_active_ads !== undefined
                        ? usage.max_active_ads
                        : t("usage.unlimited")}
                    </span>
                  </p>
                  {usage.max_ad_duration_days && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t("usage.max_duration", {
                        value: usage.max_ad_duration_days,
                      })}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    {t("usage.classes")}
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {fallbackNumber(usage.published_classes) ?? 0}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      /{" "}
                      {usage.max_active_classes !== null &&
                      usage.max_active_classes !== undefined
                        ? usage.max_active_classes
                        : t("usage.unlimited")}
                    </span>
                  </p>
                  {usage.remaining_class_slots !== null &&
                    usage.remaining_class_slots !== undefined && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t("usage.remaining_classes", {
                          value: usage.remaining_class_slots,
                        })}
                      </p>
                    )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    {t("usage.ad_credits")}
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {usage.ad_credits_remaining !== null &&
                    usage.ad_credits_remaining !== undefined
                      ? usage.ad_credits_remaining
                      : t("usage.unlimited")}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">
                    {t("usage.wallet_balance")}
                  </p>
                  <p className="text-xl font-semibold text-gray-900">
                    {walletAmountDisplay}
                  </p>
                  {walletError && (
                    <p className="text-xs text-red-500 mt-1">
                      {t("messages.wallet_error")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center space-y-2">
              <p className="text-lg font-semibold text-gray-900">
                {t("activePlan.no_plan_title")}
              </p>
              <p className="text-sm text-gray-500">
                {t("activePlan.no_plan_caption")}
              </p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FaRegClock className="text-yellow-500" />
                {t("history.heading")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("history.caption")}
              </p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
            >
              {t("actions.refresh")}
            </button>
          </div>

          {historyLoading ? (
            <p className="text-sm text-gray-500">{t("loading")}</p>
          ) : subscriptionHistory.length === 0 ? (
            <p className="text-sm text-gray-500">{t("history.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-auto text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-400 border-b">
                    <th className="py-3 pr-4">{t("history.columns.plan")}</th>
                    <th className="py-3 pr-4">{t("history.columns.interval")}</th>
                    <th className="py-3 pr-4">{t("history.columns.start")}</th>
                    <th className="py-3 pr-4">{t("history.columns.end")}</th>
                    <th className="py-3 pr-4">{t("history.columns.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptionHistory.map((entry) => {
                    const status = String(entry.computed_status || entry.status || "inactive").toLowerCase();
                    const statusLabel =
                      subscriptionStatusLabels[status] ||
                      status ||
                      t("statusLabels.unknown");
                    return (
                      <tr
                        key={entry.id}
                        className="border-b last:border-none hover:bg-gray-50 transition"
                      >
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {entry.plan_name}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {entry.interval
                            ? t(
                                entry.interval === "yearly"
                                  ? "labels.interval_yearly"
                                  : "labels.interval_monthly"
                              )
                            : t("labels.interval_unknown")}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {formatDate(entry.start_date)}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {formatDate(entry.end_date)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              STATUS_STYLES[status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t("payments.heading")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("payments.caption")}
              </p>
            </div>
            <button
              type="button"
              onClick={loadPayments}
              className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
            >
              {t("actions.refresh")}
            </button>
          </div>
          {paymentsLoading ? (
            <p className="text-sm text-gray-500">{t("loading")}</p>
          ) : paymentsError ? (
            <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
              {t("messages.payments_error")}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-gray-500">{t("payments.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] table-auto text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-400 border-b">
                    <th className="py-3 pr-4">{t("payments.columns.date")}</th>
                    <th className="py-3 pr-4">{t("payments.columns.item")}</th>
                    <th className="py-3 pr-4">{t("payments.columns.type")}</th>
                    <th className="py-3 pr-4">{t("payments.columns.amount")}</th>
                    <th className="py-3 pr-4">{t("payments.columns.status")}</th>
                    <th className="py-3 pr-4">{t("payments.columns.method")}</th>
                    <th className="py-3 pr-4">{t("payments.columns.invoice")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => {
                    const status = String(payment.status || "unknown").toLowerCase();
                    const statusLabel =
                      paymentStatusLabels[status] ||
                      status ||
                      t("statusLabels.unknown");
                    const type =
                      paymentTypeLabels[String(payment.item_type).toLowerCase()] ||
                      paymentTypeLabels.other;
                    const displayAmount = formatCurrency(payment.amount, {
                      currency: payment.currency || DEFAULT_CURRENCY,
                    });
                    const displayDate = formatDate(
                      payment.paid_at || payment.created_at
                    );

                    return (
                      <tr
                        key={payment.id}
                        className="border-b last:border-none hover:bg-gray-50 transition"
                      >
                        <td className="py-3 pr-4 text-gray-700">{displayDate}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900">
                          {payment.item_title || payment.item_id}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">{type}</td>
                        <td className="py-3 pr-4 text-gray-900">
                          {displayAmount}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              STATUS_STYLES[status] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {payment.method_name || t("payments.unknown_method")}
                        </td>
                        <td className="py-3 pr-4">
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(payment)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                          >
                            <FaDownload />
                            {t("payments.download_invoice")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t("invoices.heading")}
              </h2>
              <p className="text-sm text-gray-500">
                {t("invoices.caption")}
              </p>
            </div>
            <button
              type="button"
              onClick={loadInvoices}
              className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
            >
              {t("actions.refresh")}
            </button>
          </div>

          {invoicesLoading ? (
            <p className="text-sm text-gray-500">{t("loading")}</p>
          ) : invoicesError ? (
            <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
              {t("messages.invoices_error")}
            </div>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-gray-500">{t("invoices.empty")}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border border-gray-100 rounded-xl p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t("invoices.invoice_label", { id: invoice.id })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(invoice.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadInvoice(invoice.id);
                      } catch (err) {
                        console.error("Failed to download invoice", err);
                        toast.error(t("messages.invoice_download_failed"));
                      }
                    }}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                  >
                    <FaDownload />
                    {t("invoices.download")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
