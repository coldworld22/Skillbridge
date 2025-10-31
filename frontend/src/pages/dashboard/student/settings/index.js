import Link from "next/link";
import StudentLayout from "@/components/layouts/StudentLayout";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import {
  FaUser,
  FaCogs,
  FaShieldAlt,
  FaCreditCard,
  FaPalette,
  FaArrowRight,
  FaDownload,
  FaFileInvoice,
  FaRegClock,
  FaChartPie,
} from "react-icons/fa";
import api from "@/services/api/api";
import useSubscriptionStore from "@/store/subscriptionStore";
import useAppConfigStore from "@/store/appConfigStore";
import { fetchMyPayments } from "@/services/student/paymentService";
import {
  downloadInvoice as downloadStudentInvoice,
  fetchInvoiceByPaymentId,
} from "@/services/student/invoiceService";
import {
  fetchSubscriptionSummary,
  fetchSubscriptionHistory,
} from "@/services/subscriptionService";
import { fetchPublicPlans } from "@/services/public/planService";
import { formatCurrency } from "@/utils/currency";
import { formatDate, formatDateTime } from "@/utils/date";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import {
  fetchStudentSettings,
  updateStudentAccount,
  updateLearningPreferences,
  updatePrivacySettings,
  updateUiPreferences,
} from "@/services/student/settingsService";
import { changeStudentPassword } from "@/services/student/studentService";
import {
  findUpgradeTargetPlan,
  planRequiresPayment,
  pickDefaultInterval,
} from "@/utils/plans/upgradeHelpers";

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

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState("account");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const [learningSaving, setLearningSaving] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);
  const [uiSaving, setUiSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [accountForm, setAccountForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
    is_email_verified: false,
    is_phone_verified: false,
  });
  const [learningForm, setLearningForm] = useState({
    preferred_language: "en",
    subtitle_language: "en",
    subtitles_enabled: true,
    playback_speed: 1,
  });
  const [privacyForm, setPrivacyForm] = useState({
    two_factor_enabled: false,
    data_sharing_opt_in: true,
    show_profile_publicly: true,
  });
  const [uiForm, setUiForm] = useState({
    theme: "system",
    reduce_motion: false,
    high_contrast: false,
    density: "comfortable",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const fetchSubscription = useSubscriptionStore((state) => state.fetch);
  const appSettings = useAppConfigStore((state) => state.settings);
  const fetchAppConfig = useAppConfigStore((state) => state.fetch);
  const appConfigLoaded = useAppConfigStore((state) => state.loaded);

  const { t } = useTranslation("dashboard", {
    keyPrefix: "studentBillingPage",
  });
  const router = useRouter();

  const [logoFailed, setLogoFailed] = useState(false);

  const brandingLogoUrl = useMemo(() => {
    const branding = appSettings?.branding || {};
    return (
      branding.logo_url ||
      branding.logoUrl ||
      branding.logo ||
      branding.appLogo ||
      appSettings?.logo_url ||
      appSettings?.logoUrl ||
      "/favicon.svg"
    );
  }, [appSettings]);

  const brandingName =
    appSettings?.branding?.appName ||
    appSettings?.appName ||
    appSettings?.branding?.name ||
    "SkillBridge";

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const data = await fetchStudentSettings();
      setAccountForm({
        full_name: data?.account?.full_name || "",
        email: data?.account?.email || "",
        phone: data?.account?.phone || "",
        gender: data?.account?.gender || "",
        date_of_birth: data?.account?.date_of_birth
          ? String(data.account.date_of_birth).slice(0, 10)
          : "",
        is_email_verified: Boolean(data?.account?.is_email_verified),
        is_phone_verified: Boolean(data?.account?.is_phone_verified),
      });

      setLearningForm({
        preferred_language: data?.learning?.preferred_language || "en",
        subtitle_language:
          data?.learning?.subtitle_language ||
          data?.learning?.preferred_language ||
          "en",
        subtitles_enabled: Boolean(data?.learning?.subtitles_enabled),
        playback_speed: Number(data?.learning?.playback_speed || 1),
      });

      setPrivacyForm({
        two_factor_enabled: Boolean(data?.privacy?.two_factor_enabled),
        data_sharing_opt_in: Boolean(data?.privacy?.data_sharing_opt_in),
        show_profile_publicly: Boolean(
          data?.privacy?.show_profile_publicly
        ),
      });

      setUiForm({
        theme: data?.ui?.theme || "system",
        reduce_motion: Boolean(data?.ui?.reduce_motion),
        high_contrast: Boolean(data?.ui?.high_contrast),
        density: data?.ui?.density || "comfortable",
      });
    } catch (error) {
      console.error("Failed to load student settings", error);
      setSettingsError(error);
      toast.error("Failed to load settings");
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const getErrorMessage = useCallback((error, fallback) => {
    if (!error) return fallback || "Something went wrong";
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallback ||
      "Something went wrong"
    );
  }, []);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState(null);

  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoiceError, setInvoiceError] = useState(null);

  const [upgrading, setUpgrading] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(null);

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
      console.error("Failed to load student plan summary", err);
      setSummaryError(err);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await fetchSubscriptionHistory();
      setSubscriptionHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load student subscription history", err);
      setHistoryError(err);
      setSubscriptionHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);
    try {
      const data = await fetchMyPayments();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load student payments", err);
      setPaymentsError(err);
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    setInvoiceError(null);
    try {
      const { data } = await api.get("/invoices/student");
      setInvoices(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error("Failed to load student invoices", err);
      setInvoiceError(err);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
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
        console.error("Failed to load available student plans", err);
        setPlansError(err);
        setAvailablePlans([]);
        return [];
      } finally {
        setPlansLoading(false);
      }
    },
    []
  );

  const planRole = "student";

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    setAccountSaving(true);
    try {
      const payload = {
        full_name: accountForm.full_name?.trim(),
        phone: accountForm.phone?.trim(),
        gender: accountForm.gender || undefined,
        date_of_birth: accountForm.date_of_birth || undefined,
      };

      if (!payload.full_name) delete payload.full_name;
      if (!payload.phone) delete payload.phone;
      if (!payload.gender) delete payload.gender;
      if (!payload.date_of_birth) delete payload.date_of_birth;

      const { account } = await updateStudentAccount(payload);
      if (account) {
        setAccountForm((prev) => ({
          ...prev,
          full_name: account.full_name || "",
          phone: account.phone || "",
          gender: account.gender ?? prev.gender ?? "",
          date_of_birth: account.date_of_birth
            ? String(account.date_of_birth).slice(0, 10)
            : "",
          is_email_verified: Boolean(account.is_email_verified),
          is_phone_verified: Boolean(account.is_phone_verified),
        }));
      }
      toast.success("Account information updated");
    } catch (error) {
      console.error("Failed to update account info", error);
      toast.error(
        getErrorMessage(error, "Failed to update account information")
      );
    } finally {
      setAccountSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Please fill in your current and new password");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setPasswordSaving(true);
    try {
      await changeStudentPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Failed to change password", error);
      toast.error(getErrorMessage(error, "Failed to change password"));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLearningSubmit = async (event) => {
    event.preventDefault();
    setLearningSaving(true);
    try {
      const payload = {
        preferred_language: learningForm.preferred_language,
        subtitle_language: learningForm.subtitle_language,
        subtitles_enabled: learningForm.subtitles_enabled,
        playback_speed: Number(learningForm.playback_speed),
      };
      const { learning } = await updateLearningPreferences(payload);
      if (learning) {
        setLearningForm({
          preferred_language: learning.preferred_language,
          subtitle_language: learning.subtitle_language,
          subtitles_enabled: Boolean(learning.subtitles_enabled),
          playback_speed: Number(learning.playback_speed),
        });
      }
      toast.success("Learning preferences saved");
    } catch (error) {
      console.error("Failed to update learning preferences", error);
      toast.error(
        getErrorMessage(error, "Failed to update learning preferences")
      );
    } finally {
      setLearningSaving(false);
    }
  };

  const handlePrivacySubmit = async (event) => {
    event.preventDefault();
    setPrivacySaving(true);
    try {
      const { privacy } = await updatePrivacySettings(privacyForm);
      if (privacy) {
        setPrivacyForm({
          two_factor_enabled: Boolean(privacy.two_factor_enabled),
          data_sharing_opt_in: Boolean(privacy.data_sharing_opt_in),
          show_profile_publicly: Boolean(privacy.show_profile_publicly),
        });
      }
      toast.success("Privacy settings saved");
    } catch (error) {
      console.error("Failed to update privacy settings", error);
      toast.error(
        getErrorMessage(error, "Failed to update privacy settings")
      );
    } finally {
      setPrivacySaving(false);
    }
  };

  const handleUiSubmit = async (event) => {
    event.preventDefault();
    setUiSaving(true);
    try {
      const payload = {
        ui_theme: uiForm.theme,
        ui_reduce_motion: uiForm.reduce_motion,
        ui_high_contrast: uiForm.high_contrast,
        ui_density: uiForm.density,
      };
      const { ui } = await updateUiPreferences(payload);
      if (ui) {
        setUiForm({
          theme: ui.theme,
          reduce_motion: Boolean(ui.reduce_motion),
          high_contrast: Boolean(ui.high_contrast),
          density: ui.density,
        });
      }
      toast.success("UI preferences saved");
    } catch (error) {
      console.error("Failed to update UI preferences", error);
      toast.error(getErrorMessage(error, "Failed to update UI preferences"));
    } finally {
      setUiSaving(false);
    }
  };

  const handleDataExport = async () => {
    setExportingData(true);
    try {
      const data = await fetchStudentSettings();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `skillbridge-account-export-${new Date()
        .toISOString()
        .split("T")[0]}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success("Account data export started");
    } catch (error) {
      console.error("Failed to export account data", error);
      toast.error(getErrorMessage(error, "Failed to export account data"));
    } finally {
      setExportingData(false);
    }
  };

  useEffect(() => {
    fetchSubscription("student");
  }, [fetchSubscription]);

  useEffect(() => {
    if (!appConfigLoaded) {
      fetchAppConfig();
    }
  }, [appConfigLoaded, fetchAppConfig]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([
        loadSummary(),
        loadHistory(),
        loadPayments(),
        loadInvoices(),
      ]);
    };
    loadAll();
  }, [loadSummary, loadHistory, loadPayments, loadInvoices]);

  useEffect(() => {
    if (availablePlans.length > 0 || plansLoading || plansError) return;
    loadAvailablePlans(planRole);
  }, [planRole, availablePlans, plansLoading, plansError, loadAvailablePlans]);

  const paymentsById = useMemo(() => {
    const map = new Map();
    payments.forEach((payment) => {
      if (payment?.id) {
        map.set(payment.id, payment);
      }
    });
    return map;
  }, [payments]);

  const invoicesByPayment = useMemo(() => {
    const map = new Map();
    invoices.forEach((invoice) => {
      if (invoice?.payment_id) {
        map.set(invoice.payment_id, invoice);
      }
    });
    return map;
  }, [invoices]);

  const activeSubscription = summary?.subscription || null;
  const activePlan = summary?.plan || null;

  const upgradeButtonLabel = useMemo(() => {
    if (upgrading) return t("actions.upgrading");
    if (plansLoading) return t("loading");
    return t("actions.upgrade");
  }, [upgrading, plansLoading, t]);

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
      cancelled: t("statusLabels.cancelled"),
      expired: t("statusLabels.expired"),
      active: t("statusLabels.active"),
    }),
    [t]
  );

  const paymentTypeLabels = useMemo(
    () => ({
      class: t("paymentTypes.class"),
      tutorial: t("paymentTypes.tutorial"),
      book: t("paymentTypes.book"),
      plan: t("paymentTypes.plan"),
      subscription: t("paymentTypes.plan"),
      other: t("paymentTypes.other"),
    }),
    [t]
  );

  const paymentStats = useMemo(() => {
    let totalPaid = 0;
    let pendingCount = 0;
    let lastTimestamp = null;
    let lastCurrency = null;
    payments.forEach((payment) => {
      const amount = Number(payment.amount ?? 0);
      const status = String(payment.status || "").toLowerCase();
      if (status === "paid") {
        totalPaid += Number.isFinite(amount) ? amount : 0;
      } else {
        pendingCount += 1;
      }
      const timestampSource = payment.paid_at || payment.created_at;
      if (timestampSource) {
        const candidate = Date.parse(timestampSource);
        if (!Number.isNaN(candidate)) {
          if (lastTimestamp === null || candidate > lastTimestamp) {
            lastTimestamp = candidate;
            lastCurrency = payment.currency || lastCurrency;
          }
        }
      }
    });
    return {
      totalPaid,
      pendingCount,
      lastPurchaseAt: lastTimestamp ? new Date(lastTimestamp) : null,
      currency: lastCurrency || DEFAULT_CURRENCY,
    };
  }, [payments]);

  const upgradeTarget = useMemo(
    () => findUpgradeTargetPlan(availablePlans, activePlan),
    [availablePlans, activePlan]
  );

  const isOnHighestPlan = useMemo(
    () => !plansLoading && availablePlans.length > 0 && !upgradeTarget,
    [plansLoading, availablePlans.length, upgradeTarget]
  );

  const handleUpgrade = async () => {
    let plans = availablePlans;
    if (plans.length === 0 && !plansLoading) {
      plans = await loadAvailablePlans(planRole);
    }

    const targetPlan =
      plans.length > 0 ? findUpgradeTargetPlan(plans, activePlan) : null;

    if (!targetPlan) {
      toast.info(t("messages.upgrade_unavailable"));
      router.push("/plans");
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
      await Promise.all([loadSummary(), loadHistory()]);
      await fetchSubscription("student");
      await loadAvailablePlans(planRole);
    } catch (err) {
      console.error("Student upgrade failed", err);
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
      await Promise.all([loadSummary(), loadHistory()]);
      await fetchSubscription("student");
    } catch (err) {
      console.error("Student cancel failed", err);
      toast.error(t("messages.cancel_failed"));
    } finally {
      setCanceling(false);
    }
  };

  const handleDownloadInvoice = async (payment) => {
    if (!payment) return;
    try {
      if (payment.invoice_id) {
        await downloadStudentInvoice(payment.invoice_id);
        return;
      }
      if (payment.invoice_pdf_url) {
        window.open(payment.invoice_pdf_url, "_blank", "noopener");
        return;
      }
      const invoice = await fetchInvoiceByPaymentId(payment.id);
      if (invoice?.id) {
        await downloadStudentInvoice(invoice.id);
        return;
      }
      toast.error(t("messages.invoice_not_found"));
    } catch (err) {
      console.error("Failed to download student invoice", err);
      toast.error(t("messages.invoice_download_failed"));
    }
  };

  const tabs = useMemo(
    () => [
      { id: "account", label: "Account Info", icon: <FaUser /> },
      { id: "preferences", label: "Learning Preferences", icon: <FaCogs /> },
      { id: "privacy", label: "Privacy & Security", icon: <FaShieldAlt /> },
      { id: "billing", label: t("tabLabel"), icon: <FaCreditCard /> },
      { id: "ui", label: "UI Preferences", icon: <FaPalette /> },
    ],
    [t]
  );

  const tabQuery = router.query?.tab;
  useEffect(() => {
    if (!router?.isReady) return;
    const requestedTab = String(tabQuery || "").toLowerCase();
    if (!requestedTab) return;
    const exists = tabs.some((tab) => tab.id === requestedTab);
    if (exists) {
      setActiveTab(requestedTab);
    }
  }, [router.isReady, tabQuery, tabs]);

  return (
    <StudentLayout>
      <div className="p-6 max-w-5xl mx-auto text-gray-800">
        <h1 className="text-3xl font-bold mb-6 text-yellow-500">
          ⚙️ Student Settings
        </h1>

        <div className="flex gap-4 border-b pb-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-2 pb-1 font-medium transition ${
                activeTab === tab.id
                  ? "text-yellow-600 border-b-2 border-yellow-600"
                  : "text-gray-500 hover:text-yellow-600"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "account" && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow p-6 md:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Account Information
                  </h2>
                  <p className="text-sm text-gray-500">
                    Keep your personal details up to date to receive important
                    updates.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      accountForm.is_email_verified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        accountForm.is_email_verified
                          ? "bg-emerald-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {accountForm.is_email_verified
                      ? "Email Verified"
                      : "Email Unverified"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      accountForm.is_phone_verified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        accountForm.is_phone_verified
                          ? "bg-emerald-500"
                          : "bg-gray-400"
                      }`}
                    />
                    {accountForm.is_phone_verified
                      ? "Phone Verified"
                      : "Phone Unverified"}
                  </span>
                </div>
              </div>

              {settingsLoading ? (
                <p className="mt-6 text-sm text-gray-500">
                  Loading account details...
                </p>
              ) : settingsError ? (
                <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  {getErrorMessage(
                    settingsError,
                    "Failed to load account details"
                  )}
                </div>
              ) : (
                <form onSubmit={handleAccountSubmit} className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Full Name
                      </span>
                      <input
                        type="text"
                        value={accountForm.full_name}
                        onChange={(event) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            full_name: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                        placeholder="Your full name"
                        required
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Email Address
                      </span>
                      <input
                        type="email"
                        value={accountForm.email}
                        disabled
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Phone Number
                      </span>
                      <input
                        type="tel"
                        value={accountForm.phone}
                        onChange={(event) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                        placeholder="+966 50 000 0000"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Gender
                      </span>
                      <select
                        value={accountForm.gender}
                        onChange={(event) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            gender: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </label>
                    <label className="space-y-2 md:col-span-2 md:max-w-xs">
                      <span className="text-sm font-semibold text-gray-700">
                        Date of Birth
                      </span>
                      <input
                        type="date"
                        value={accountForm.date_of_birth}
                        onChange={(event) =>
                          setAccountForm((prev) => ({
                            ...prev,
                            date_of_birth: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                      />
                    </label>
                  </div>
                  <div className="flex flex-col gap-3 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
                    <span>
                      Need to update your email? Contact support so we can keep
                      your account secure.
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={loadSettings}
                        disabled={settingsLoading || accountSaving}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        disabled={accountSaving}
                        className="rounded-lg bg-yellow-500 px-5 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {accountSaving ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </section>
            <section className="bg-white rounded-2xl shadow p-6 md:p-8">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-500">
                    Create a strong password with at least 8 characters
                    combining numbers and symbols.
                  </p>
                </div>
              </div>
              <form
                onSubmit={handlePasswordSubmit}
                className="mt-6 grid gap-4 md:grid-cols-2"
              >
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Current Password
                  </span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    placeholder="••••••••"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    New Password
                  </span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    placeholder="••••••••"
                    required
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Confirm Password
                  </span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    placeholder="••••••••"
                    required
                  />
                </label>
                <div className="md:col-span-2 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {passwordSaving ? "Updating..." : "Update password"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {activeTab === "preferences" && (
          <section className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Learning Preferences
                </h2>
                <p className="text-sm text-gray-500">
                  Personalize language, subtitles, and playback speed for a
                  learning experience that feels right.
                </p>
              </div>
            </div>

            {settingsLoading ? (
              <p className="text-sm text-gray-500">Loading preferences...</p>
            ) : settingsError ? (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {getErrorMessage(
                  settingsError,
                  "Failed to load learning preferences"
                )}
              </div>
            ) : (
              <form onSubmit={handleLearningSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Preferred Language
                    </span>
                    <select
                      value={learningForm.preferred_language}
                      onChange={(event) =>
                        setLearningForm((prev) => ({
                          ...prev,
                          preferred_language: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="fr">French</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Subtitle Language
                    </span>
                    <select
                      value={learningForm.subtitle_language}
                      onChange={(event) =>
                        setLearningForm((prev) => ({
                          ...prev,
                          subtitle_language: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="fr">French</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Playback Speed
                    </span>
                    <select
                      value={String(learningForm.playback_speed)}
                      onChange={(event) =>
                        setLearningForm((prev) => ({
                          ...prev,
                          playback_speed: Number(event.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    >
                      {[0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                        <option key={speed} value={String(speed)}>
                          {speed}x
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      Show subtitles by default
                    </span>
                    <input
                      type="checkbox"
                      checked={learningForm.subtitles_enabled}
                      onChange={(event) =>
                        setLearningForm((prev) => ({
                          ...prev,
                          subtitles_enabled: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    We will remember this preference for every new lesson.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={loadSettings}
                    disabled={settingsLoading || learningSaving}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={learningSaving}
                    className="rounded-lg bg-yellow-500 px-5 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {learningSaving ? "Saving..." : "Save preferences"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {activeTab === "privacy" && (
          <section className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Privacy & Security
                </h2>
                <p className="text-sm text-gray-500">
                  Decide how your information is shared and keep your account
                  protected.
                </p>
              </div>
            </div>

            {settingsLoading ? (
              <p className="text-sm text-gray-500">
                Loading security preferences...
              </p>
            ) : settingsError ? (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {getErrorMessage(
                  settingsError,
                  "Failed to load privacy preferences"
                )}
              </div>
            ) : (
              <form onSubmit={handlePrivacySubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-xs text-gray-500">
                          Add a verification code each time you sign in from a
                          new device.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyForm.two_factor_enabled}
                        onChange={(event) =>
                          setPrivacyForm((prev) => ({
                            ...prev,
                            two_factor_enabled: event.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    </div>
                    <p className="mt-3 text-xs text-emerald-600">
                      {privacyForm.two_factor_enabled
                        ? "2FA is enabled. We will ask for a verification code on unfamiliar devices."
                        : "Enable 2FA to add an extra layer of security."}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Personalized Recommendations
                        </h3>
                        <p className="text-xs text-gray-500">
                          Allow SkillBridge to use your activity to improve
                          course suggestions.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyForm.data_sharing_opt_in}
                        onChange={(event) =>
                          setPrivacyForm((prev) => ({
                            ...prev,
                            data_sharing_opt_in: event.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      Turn this off to see only essential recommendations.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4 md:col-span-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">
                          Public Profile
                        </h3>
                        <p className="text-xs text-gray-500">
                          Decide if instructors and peers can view your profile
                          when collaborating.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacyForm.show_profile_publicly}
                        onChange={(event) =>
                          setPrivacyForm((prev) => ({
                            ...prev,
                            show_profile_publicly: event.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      When disabled, only instructors you enroll with can see
                      your profile.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <button
                      type="button"
                      onClick={handleDataExport}
                      disabled={exportingData}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <FaDownload className="text-yellow-500" />
                      {exportingData ? "Preparing..." : "Download my data"}
                    </button>
                    <Link
                      href="/delete-account"
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700"
                    >
                      Delete account
                    </Link>
                  </div>
                  <button
                    type="submit"
                    disabled={privacySaving}
                    className="rounded-lg bg-yellow-500 px-5 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {privacySaving ? "Saving..." : "Update privacy"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {activeTab === "billing" && (
          <div className="space-y-6">
            <section className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaFileInvoice className="text-yellow-500" />
                    {t("title")}
                  </h2>
                  <p className="text-sm text-gray-500">{t("subtitle")}</p>
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
                        {t("stats.total_spent")}
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(paymentStats.totalPaid, {
                          currency: paymentStats.currency,
                        })}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {t("stats.pending_payments")}
                      </p>
                      <p className="text-xl font-semibold text-gray-900">
                        {paymentStats.pendingCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {t("stats.last_purchase")}
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        {paymentStats.lastPurchaseAt
                          ? formatDateTime(paymentStats.lastPurchaseAt)
                          : t("stats.none")}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {t("stats.plan_status")}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {String(activeSubscription.status || "")
                          .toLowerCase()
                          .split("_")
                          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                          .join(" ") || t("statusLabels.unknown")}
                      </p>
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
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaRegClock className="text-yellow-500" />
                    {t("history.heading")}
                  </h3>
                  <p className="text-sm text-gray-500">{t("history.caption")}</p>
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
              ) : historyError ? (
                <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
                  {t("messages.history_error")}
                </div>
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
                        const status = String(entry.computed_status || entry.status || "unknown").toLowerCase();
                        const statusLabel =
                          paymentStatusLabels[status] ||
                          status ||
                          t("statusLabels.unknown");
                        const interval =
                          entry.interval === "yearly"
                            ? t("labels.interval_yearly")
                            : entry.interval === "monthly"
                            ? t("labels.interval_monthly")
                            : t("labels.interval_unknown");
                        return (
                          <tr
                            key={entry.id}
                            className="border-b last:border-none hover:bg-gray-50 transition"
                          >
                            <td className="py-3 pr-4 font-medium text-gray-900">
                              {entry.plan_name}
                            </td>
                            <td className="py-3 pr-4 text-gray-700">{interval}</td>
                            <td className="py-3 pr-4 text-gray-700">
                              {formatDate(entry.start_date)}
                            </td>
                            <td className="py-3 pr-4 text-gray-700">
                              {formatDate(entry.end_date)}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
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
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaChartPie className="text-yellow-500" />
                    {t("payments.heading")}
                  </h3>
                  <p className="text-sm text-gray-500">{t("payments.caption")}</p>
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
                  <table className="w-full min-w-[780px] table-auto text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-gray-400 border-b">
                        <th className="py-3 pr-4">{t("payments.columns.date")}</th>
                        <th className="py-3 pr-4">{t("payments.columns.item")}</th>
                        <th className="py-3 pr-4">{t("payments.columns.type")}</th>
                        <th className="py-3 pr-4">{t("payments.columns.amount")}</th>
                        <th className="py-3 pr-4">{t("payments.columns.status")}</th>
                        <th className="py-3 pr-4">{t("payments.columns.method")}</th>
                        <th className="py-3 pr-4">{t("payments.columns.reference")}</th>
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
                        const itemLabel =
                          payment.item_title ||
                          payment.plan_name ||
                          payment.class_title ||
                          payment.tutorial_title ||
                          payment.book_title ||
                          payment.item_type ||
                          t("paymentTypes.other");
                        const itemTypeLabel =
                          paymentTypeLabels[String(payment.item_type || "other").toLowerCase()] ||
                          paymentTypeLabels.other;
                        const displayAmount = formatCurrency(payment.amount, {
                          currency: payment.currency || DEFAULT_CURRENCY,
                        });
                        const displayDate = formatDateTime(
                          payment.paid_at || payment.created_at
                        );
                        const mergedInvoice =
                          invoicesByPayment.get(payment.id) || null;

                        return (
                          <tr
                            key={payment.id}
                            className="border-b last:border-none hover:bg-gray-50 transition"
                          >
                            <td className="py-3 pr-4 text-gray-700">
                              {displayDate}
                            </td>
                            <td className="py-3 pr-4 font-medium text-gray-900">
                              {itemLabel}
                            </td>
                            <td className="py-3 pr-4 text-gray-700">
                              {itemTypeLabel}
                            </td>
                            <td className="py-3 pr-4 text-gray-900">
                              {displayAmount}
                            </td>
                            <td className="py-3 pr-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {statusLabel}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-gray-700">
                              {payment.method_name || t("payments.unknown_method")}
                            </td>
                            <td className="py-3 pr-4 text-gray-700">
                              {payment.reference_id || "—"}
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
                              {mergedInvoice && (
                                <p className="text-xs text-gray-400">
                                  {t("payments.invoice_reference", {
                                    id: mergedInvoice.id,
                                  })}
                                </p>
                              )}
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
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <FaFileInvoice className="text-yellow-500" />
                    {t("invoices.heading")}
                  </h3>
                  <p className="text-sm text-gray-500">{t("invoices.caption")}</p>
                </div>
                <button
                  type="button"
                  onClick={loadInvoices}
                  className="text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                >
                  {t("actions.refresh")}
                </button>
              </div>

              {loadingInvoices ? (
                <p className="text-sm text-gray-500">{t("loading")}</p>
              ) : invoiceError ? (
                <div className="bg-red-50 text-red-600 rounded-lg p-4 text-sm">
                  {t("messages.invoices_error")}
                </div>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-gray-500">{t("invoices.empty")}</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => {
                    const payment = paymentsById.get(invoice.payment_id);
                    const paymentStatus = String(payment?.status || "paid").toLowerCase();
                    const statusLabel =
                      paymentStatusLabels[paymentStatus] ||
                      paymentStatus ||
                      t("statusLabels.unknown");
                    const currencyCode =
                      invoice.currency || payment?.currency || DEFAULT_CURRENCY;
                    const amountDisplay = formatCurrency(invoice.amount, {
                      currency: currencyCode,
                    });
                    const itemLabel =
                      payment?.item_title ||
                      payment?.plan_name ||
                      payment?.class_title ||
                      payment?.tutorial_title ||
                      payment?.book_title ||
                      t("invoices.labels.item_unknown");
                    const itemTypeLabel =
                      paymentTypeLabels[String(payment?.item_type || "other").toLowerCase()] ||
                      paymentTypeLabels.other;
                    const paymentMethod =
                      payment?.method_name || t("payments.unknown_method");
                    const reference = payment?.reference_id || "—";
                    const issuedOn = formatDate(invoice.created_at);
                    const paymentDate = formatDateTime(
                      payment?.paid_at || payment?.created_at || invoice.created_at
                    );
                    const billedTo =
                      invoice.details?.user?.full_name ||
                      t("invoices.labels.billed_to_unknown");
                    const billedEmail = invoice.details?.user?.email || null;

                    return (
                      <article
                        key={invoice.id}
                        className="border border-gray-100 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm bg-white"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {!logoFailed && brandingLogoUrl ? (
                              <img
                                src={brandingLogoUrl}
                                alt={brandingName}
                                className="h-10 w-auto rounded-md object-contain bg-gray-50 p-1"
                                onError={() => setLogoFailed(true)}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-md bg-yellow-500/20 flex items-center justify-center">
                                <span className="text-sm font-semibold text-yellow-700">
                                  {brandingName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-400">
                                {brandingName}
                              </p>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {t("invoices.invoice_label", { id: invoice.id })}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {t("invoices.labels.issued")} {issuedOn}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await downloadStudentInvoice(invoice.id);
                              } catch (err) {
                                console.error("Failed to download student invoice", err);
                                toast.error(t("messages.invoice_download_failed"));
                              }
                            }}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-yellow-600 hover:text-yellow-700"
                          >
                            <FaDownload />
                            {t("invoices.download")}
                          </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 text-sm text-gray-700">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              {t("invoices.labels.billed_to")}
                            </p>
                            <p className="font-medium text-gray-900">{billedTo}</p>
                            {billedEmail && (
                              <p className="text-gray-500">{billedEmail}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-400">
                              {t("invoices.labels.total_due")}
                            </p>
                            <p className="font-semibold text-gray-900">
                              {amountDisplay}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t("invoices.labels.payment_date")}: {paymentDate}
                            </p>
                          </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-gray-100">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs uppercase tracking-wide text-gray-400 bg-gray-50">
                                <th className="py-3 pl-4 pr-3">
                                  {t("invoices.table.item")}
                                </th>
                                <th className="py-3 px-3">
                                  {t("invoices.table.type")}
                                </th>
                                <th className="py-3 px-3">
                                  {t("invoices.table.status")}
                                </th>
                                <th className="py-3 px-3">
                                  {t("invoices.table.method")}
                                </th>
                                <th className="py-3 px-3">
                                  {t("invoices.table.reference")}
                                </th>
                                <th className="py-3 pr-4 pl-3 text-right">
                                  {t("invoices.table.total")}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-t border-gray-100">
                                <td className="py-3 pl-4 pr-3 font-medium text-gray-900">
                                  {itemLabel}
                                </td>
                                <td className="py-3 px-3 text-gray-700">
                                  {itemTypeLabel}
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                      STATUS_STYLES[paymentStatus] ||
                                      "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-gray-700">
                                  {paymentMethod}
                                </td>
                                <td className="py-3 px-3 text-gray-700">
                                  {reference}
                                </td>
                                <td className="py-3 pr-4 pl-3 text-right font-semibold text-gray-900">
                                  {amountDisplay}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "ui" && (
          <section className="bg-white rounded-2xl shadow p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Interface Preferences
                </h2>
                <p className="text-sm text-gray-500">
                  Choose how SkillBridge should look and feel while you learn.
                </p>
              </div>
            </div>

            {settingsLoading ? (
              <p className="text-sm text-gray-500">
                Loading interface preferences...
              </p>
            ) : settingsError ? (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {getErrorMessage(
                  settingsError,
                  "Failed to load interface preferences"
                )}
              </div>
            ) : (
              <form onSubmit={handleUiSubmit} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Theme
                    </span>
                    <select
                      value={uiForm.theme}
                      onChange={(event) =>
                        setUiForm((prev) => ({
                          ...prev,
                          theme: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    >
                      <option value="system">Match system</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-gray-700">
                      Layout Density
                    </span>
                    <select
                      value={uiForm.density}
                      onChange={(event) =>
                        setUiForm((prev) => ({
                          ...prev,
                          density: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </select>
                  </label>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Reduce Motion
                      </p>
                      <p className="text-xs text-gray-500">
                        Minimal animations for a calmer, more accessible
                        interface.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={uiForm.reduce_motion}
                      onChange={(event) =>
                        setUiForm((prev) => ({
                          ...prev,
                          reduce_motion: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        High Contrast Mode
                      </p>
                      <p className="text-xs text-gray-500">
                        Increase contrast to make text and visuals easier to
                        read.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={uiForm.high_contrast}
                      onChange={(event) =>
                        setUiForm((prev) => ({
                          ...prev,
                          high_contrast: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={loadSettings}
                    disabled={settingsLoading || uiSaving}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={uiSaving}
                    className="rounded-lg bg-yellow-500 px-5 py-2 text-sm font-semibold text-black shadow-sm transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {uiSaving ? "Saving..." : "Save interface"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </StudentLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
