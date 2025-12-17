import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import usePermission from "@/hooks/usePermission";
import { ADMIN_PERMISSIONS } from "@/constants/adminPermissions";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import dayjs from "dayjs";
import {
  FaChartBar,
  FaList,
  FaCog,
  FaWallet,
  FaMoneyCheckAlt,
  FaToggleOn,
  FaToggleOff,
  FaPlus,
  FaStar,
  FaUniversity,
} from "react-icons/fa";
import OverviewTab from "./OverviewTab";

import { fetchPayments, updatePayment } from "@/services/admin/paymentService";
import {
  fetchBankTransfers,
  approveBankTransfer,
  rejectBankTransfer,
} from "@/services/admin/bankTransferService";
import {
  fetchMethods,
  updateMethod,
  deleteMethod,
} from "@/services/admin/paymentMethodService";
import { fetchPaymentConfig, updatePaymentConfig } from "@/services/admin/paymentConfigService";
import { fetchPayouts, updatePayout } from "@/services/admin/payoutService";
import { toast } from "react-toastify";
import { createNotification } from "@/services/notificationService";
import { sendChatMessage } from "@/services/messageService";
import useAuthStore from "@/store/auth/authStore";
import useNotificationStore from "@/store/notifications/notificationStore";
import useMessageStore from "@/store/messages/messageStore";
import useAdminNotice from "@/hooks/useAdminNotice";
import { formatCurrency } from "@/utils/currency";
import {
  normalizePaymentStatus,
  mapUiStatusToApiStatus,
} from "@/utils/paymentStatus";
import styles from "./payments.module.scss";

const defaultConfig = {
  currency: "USD",
  minimumPayoutAmount: 100,
  platformCut: {
    class: 15,
    book: 10,
    tutorial: 20,
  },
  invoice: {
    logoUrl: "",
    footerText: "Thank you for using our platform!",
    autoEmail: true,
  },
  refundPolicy:
    "Refunds can be requested within 7 days of payment. Contact support for processing.",
};

const statusFilterOptions = ["paid", "pending", "failed", "rejected", "refunded"];

const formatDateTime = (value) =>
  value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "—";

const shapePayoutRecord = (record = {}) => {
  const rawStatus = (record.status || "").toString();
  const normalizedStatus = normalizePaymentStatus(rawStatus);
  const displayDate =
    record.processed_at ||
    record.requested_at ||
    record.created_at ||
    record.date ||
    null;
  const instructorDisplay =
    record.instructor_name ||
    record.instructor ||
    record.instructorDisplay ||
    record.instructor_id ||
    "—";

  return {
    ...record,
    rawStatus,
    status: normalizedStatus,
    displayDate,
    instructorDisplay,
  };
};

const formatAmount = (value, currency) =>
  formatCurrency(value, { currency, fallback: "—" });

const normalizeTransaction = (transaction = {}) => {
  const normalizedStatus = normalizePaymentStatus(transaction.status);
  const rawMethodId = transaction.method_id ?? transaction.methodId;
  return {
    ...transaction,
    date: transaction.paid_at || transaction.created_at || transaction.date,
    user: transaction.user_name || transaction.user,
    role: transaction.user_role || transaction.role,
    email: transaction.user_email || transaction.email,
    instructor: transaction.instructor_name || transaction.instructor,
    instructorEmail: transaction.instructor_email || transaction.instructorEmail,
    method: transaction.method_name || transaction.method,
    methodId: rawMethodId ? String(rawMethodId) : null,
    type: transaction.item_type || transaction.type,
    itemTitle: transaction.item_title || transaction.itemTitle || transaction.item_type,
    currency: transaction.currency || "USD",
    reference: transaction.reference_id || transaction.reference,
    status: normalizedStatus,
    platformFee: parseFloat(transaction.platform_fee ?? transaction.platformFee ?? 0),
    instructorAmount: parseFloat(
      transaction.instructor_amount ?? transaction.instructorAmount ?? transaction.amount ?? 0
    ),
    amount: parseFloat(transaction.amount ?? transaction.total ?? 0),
    itemPrice: parseFloat(transaction.item_price ?? transaction.itemPrice ?? transaction.amount ?? 0),
  };
};

const statusClass = (status) => {
  const normalized = normalizePaymentStatus(status);
  switch (normalized) {
    case "paid":
      return styles.statusPaid;
    case "pending":
      return styles.statusPending;
    case "failed":
      return styles.statusFailed;
    case "rejected":
      return styles.statusRejected;
    case "refunded":
      return styles.statusRefunded;
    default:
      return styles.statusMuted;
  }
};

function AdminPaymentsPage() {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const user = useAuthStore((s) => s.user);
  const refreshNotifications = useNotificationStore((s) => s.fetch);
  const refreshMessages = useMessageStore((s) => s.fetch);
  const { can, requirePermission } = usePermission();
  const managePermission = ADMIN_PERMISSIONS.PAYMENTS.MANAGE;
  const canManagePayments = can(managePermission);
  const managePermissionError = t("paymentsPage.permission_denied", {
    defaultValue: "You do not have permission to manage payments.",
  });
  const ensureCanManagePayments = () =>
    requirePermission(managePermission, managePermissionError);

  const tabs = useMemo(
    () => [
      { key: "overview", label: t("paymentsPage.tabs.overview"), icon: <FaChartBar /> },
      { key: "transactions", label: t("paymentsPage.tabs.transactions"), icon: <FaList /> },
      { key: "methods", label: t("paymentsPage.tabs.methods"), icon: <FaMoneyCheckAlt /> },
      ...(canManagePayments
        ? [{ key: "configuration", label: t("paymentsPage.tabs.configuration"), icon: <FaCog /> }]
        : []),
      { key: "payouts", label: t("paymentsPage.tabs.payouts"), icon: <FaWallet /> },
      { key: "bankTransfers", label: t("paymentsPage.tabs.bankTransfers"), icon: <FaUniversity /> },
    ],
    [canManagePayments, t]
  );

  const notifyUser = async (userId, type, message) => {
    if (!userId) {
      console.warn("Attempted to notify without a valid user id.");
      return;
    }
    try {
      await createNotification({ user_id: userId, type, message });
      await sendChatMessage(userId, { text: message });
      refreshNotifications?.();
      refreshMessages?.();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to send notification";
      toast.error(msg);
    }
  };
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!canManagePayments && activeTab === "configuration") {
      setActiveTab("overview");
    }
  }, [activeTab, canManagePayments]);

  const [transactions, setTransactions] = useState([]);
  const [methods, setMethods] = useState([]);
  const notify = useAdminNotice();

  const [bankTransfers, setBankTransfers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const translateStatus = (status) =>
    t(`paymentsPage.${status}`, { defaultValue: t("paymentsPage.pending") });
  const getItemTypeLabel = (itemType) => {
    if (!itemType) return "—";
    const fallback = itemType.replace(/_/g, " ");
    const normalized = fallback.charAt(0).toUpperCase() + fallback.slice(1);
    return t(`paymentsPage.item_types.${itemType}`, {
      defaultValue: normalized,
    });
  };

  const [form, setForm] = useState(defaultConfig);
  const [errors, setErrors] = useState({});
  const [payouts, setPayouts] = useState([]);
  const [processingRefundId, setProcessingRefundId] = useState(null);

  const loadBankTransfers = async () => {
    try {
      const data = await fetchBankTransfers();
      setBankTransfers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load bank transfers", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [txns, mths, cfg, pouts] = await Promise.all([
          fetchPayments(),
          fetchMethods(),
          fetchPaymentConfig(),
          fetchPayouts(),
        ]);
        const safeTxns = Array.isArray(txns) ? txns : [];
        const safeMethods = Array.isArray(mths) ? mths : [];
        const safePayouts = Array.isArray(pouts) ? pouts : [];

        setTransactions(safeTxns.map((txn) => normalizeTransaction(txn)));
        setMethods(
          safeMethods.map((m) => ({
            ...m,
            configurable: true,
            configPath: `/dashboard/admin/payments/methods/configure/${m.id}`,
          }))
        );
        setPayouts(safePayouts.map((p) => shapePayoutRecord(p)));

        if (cfg) {
          const merged = {
            ...defaultConfig,
            ...cfg,
            platformCut: {
              ...defaultConfig.platformCut,
              ...(cfg.platformCut || {}),
            },
            invoice: {
              ...defaultConfig.invoice,
              ...(cfg.invoice || {}),
            },
          };
          setForm(merged);
        } else {
          setForm(defaultConfig);
        }
      } catch (err) {
        console.error("Failed to load payment data", err);
      }
    };
    loadData();
    loadBankTransfers();
  }, []);

  const filteredTransactions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return transactions.filter((txn) => {
      const matchesSearch =
        !search ||
        [txn.user, txn.email, txn.itemTitle, txn.reference, txn.id]
          .filter(Boolean)
          .some((field) => field.toString().toLowerCase().includes(search));

      const matchesMethod = methodFilter === "all" || (txn.methodId && txn.methodId === methodFilter);

      const matchesStatus = statusFilter === "all" || txn.status === statusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [transactions, searchTerm, methodFilter, statusFilter]);

  const toggleStatus = async (id) => {
    if (!ensureCanManagePayments()) return;
    try {
      const method = methods.find((m) => m.id === id);
      if (!method) return;
      await updateMethod(id, { active: !method.active });
      setMethods((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: !m.active } : m))
      );
      const action = method.active ? "deactivated" : "activated";
      toast.success(`Payment method "${method.name}" ${action}`);
      const msg = `Payment method "${method.name}" status changed`;
      if (user?.id) {
        try {
          await notify("payment_method_status_changed", msg);
        } catch (err) {
          console.error("Failed to send payment method status notice", err);
        }
      }
    } catch (err) {
      console.error("Failed to update method", err);
      toast.error(t("paymentsPage.update_failed"));
    }
  };

  const toggleDefault = async (id) => {
    if (!ensureCanManagePayments()) return;
    try {
      const method = methods.find((m) => m.id === id);
      if (!method) return;
      const newState = !method.is_default;
      await updateMethod(id, { is_default: newState });
      setMethods((prev) =>
        prev.map((m) =>
          m.id === id
            ? { ...m, is_default: newState }
            : newState
            ? { ...m, is_default: false }
            : m
        )
      );
      const action = newState ? "set as default" : "removed from default";
      toast.success(`Payment method "${method.name}" ${action}`);
      const msg = `Payment method "${method.name}" set as default`;
      if (user?.id) {
        try {
          await notify("payment_method_default_changed", msg);
        } catch (err) {
          console.error("Failed to send payment method default notice", err);
        }
      }
    } catch (err) {
      console.error("Failed to update default method", err);
      toast.error(t("paymentsPage.update_failed"));
    }
  };

  const handleDelete = async (id) => {
    if (!ensureCanManagePayments()) return;
    try {
      const methodName = methods.find((m) => m.id === id)?.name;
      await deleteMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success(`Payment method "${methodName}" deleted`);
      const msg = `Payment method "${methodName}" deleted.`;
      if (user?.id) {
        try {
          await notify("payment_method_deleted", msg);
        } catch (err) {
          console.error("Failed to send payment method deleted notice", err);
        }
      }
    } catch (err) {
      console.error("Failed to delete method", err);
      toast.error(t("paymentsPage.delete_failed"));
    }
  };

  const validate = (data) => {
    const errs = {};
    if (!data.currency) errs.currency = t("paymentsPage.currency_required");
    if (data.minimumPayoutAmount === "" || isNaN(data.minimumPayoutAmount)) {
      errs.minimumPayoutAmount = t("paymentsPage.required");
    } else if (data.minimumPayoutAmount < 0) {
      errs.minimumPayoutAmount = t("paymentsPage.must_be_positive");
    }
    Object.entries(data.platformCut).forEach(([key, val]) => {
      if (val === "" || isNaN(val)) {
        errs[`platformCut.${key}`] = t("paymentsPage.required");
      } else if (val < 0 || val > 100) {
        errs[`platformCut.${key}`] = t("paymentsPage.between_0_100");
      }
    });
    if (!data.refundPolicy) errs.refundPolicy = t("paymentsPage.refund_policy_required");
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  useEffect(() => {
    validate(form);
  }, [form]);

  const handleChange = (e) => {
    if (!canManagePayments) return;
    const { name, value, type, checked } = e.target;
    if (name === "minimumPayoutAmount") {
      setForm((prev) => ({
        ...prev,
        minimumPayoutAmount: value === "" ? "" : parseFloat(value),
      }));
    } else if (name.includes("platformCut")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        platformCut: {
          ...prev.platformCut,
          [key]: value === "" ? "" : parseFloat(value),
        },
      }));
    } else if (name.includes("invoice")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        invoice: { ...prev.invoice, [key]: type === "checkbox" ? checked : value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  };

  const handleSave = async () => {
    if (!ensureCanManagePayments()) return;
    if (!validate(form)) {
      toast.error(t("paymentsPage.correct_errors"));
      return;
    }
    try {
      await updatePaymentConfig(form);
      toast.success(t("paymentsPage.config_saved"));
    } catch (err) {
      toast.error(err?.response?.data?.message || t("paymentsPage.config_save_failed"));
    }
  };

  const handleViewAllTransactions = () => setActiveTab("transactions");
  const handleViewTransaction = (txn) => {
    if (!txn?.id) return;
    router.push(`/payments/invoice/${txn.id}`);
  };

  const handleRefundTransaction = async (txn) => {
    if (!txn?.id) return;
    if (!ensureCanManagePayments()) return;
    const confirmed = window.confirm(`${t("paymentsPage.refund")} #${txn.id}?`);
    if (!confirmed) return;
    try {
      setProcessingRefundId(txn.id);
      const updated = await updatePayment(txn.id, { status: "refunded" });
      if (updated) {
        const shaped = normalizeTransaction({ ...txn, ...updated });
        setTransactions((prev) =>
          prev.map((payment) => (payment.id === txn.id ? shaped : payment))
        );
      }
      toast.success(t("paymentsPage.status_updated"));
    } catch (err) {
      console.error("Failed to refund payment", err);
      const msg = err?.response?.data?.message || t("paymentsPage.update_failed");
      toast.error(msg);
    } finally {
      setProcessingRefundId(null);
    }
  };

  const updateStatus = async (id, newStatus) => {
    if (!ensureCanManagePayments()) return;
    try {
      const payout = payouts.find((p) => p.id === id);
      const apiStatus = mapUiStatusToApiStatus(newStatus);
      const updated = await updatePayout(id, { status: apiStatus });
      setPayouts((prev) =>
        prev.map((p) => (p.id === id ? shapePayoutRecord({ ...p, ...updated }) : p))
      );
      toast.success(t("paymentsPage.payout_status_updated"));
      if (user?.id) {
        await notifyUser(
          user.id,
          "payout_status_changed",
          `Payout ${id} marked as ${updated.status}.`
        );
      }
      if (payout?.instructor_id && payout.instructor_id !== user?.id) {
        notifyUser(
          payout.instructor_id,
          "payout_status_changed",
          `Your payout request ${id} was ${updated.status.toLowerCase()}.`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(t("paymentsPage.payout_status_failed"));
    }
  };

  const handleApprove = async (id) => {
    if (!ensureCanManagePayments()) return;
    try {
      await approveBankTransfer(id);
      toast.success(t("paymentsPage.status_updated"));
      loadBankTransfers();
    } catch (err) {
      console.error(err);
      toast.error(t("paymentsPage.update_failed"));
    }
  };

  const handleReject = async (id) => {
    if (!ensureCanManagePayments()) return;
    try {
      await rejectBankTransfer(id);
      toast.success(t("paymentsPage.status_updated"));
      loadBankTransfers();
    } catch (err) {
      console.error(err);
      toast.error(t("paymentsPage.update_failed"));
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            transactions={transactions}
            methods={methods}
            payouts={payouts}
            onViewAll={handleViewAllTransactions}
          />
        );

      case "transactions":
        return (
          <div className={styles.section}>
            <div className={styles.card}>
              <div className={styles.filterBar}>
                <div className={styles.filterControls}>
                  <input
                    type="text"
                    placeholder={t("paymentsPage.search_placeholder")}
                    className={`${styles.input} ${styles.inputNarrow}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <select
                    className={`${styles.select} ${styles.inputNarrow}`}
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                  >
                    <option value="all">{t("paymentsPage.all_methods")}</option>
                    {methods.map((m) => (
                      <option key={m.id} value={String(m.id)}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={`${styles.select} ${styles.inputNarrow}`}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">{t("paymentsPage.all_status")}</option>
                    {statusFilterOptions.map((status) => (
                      <option key={status} value={status}>
                        {translateStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
                <button className={styles.primaryButton}>
                  {t("paymentsPage.export_csv")}
                </button>
              </div>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>{t("paymentsPage.transaction_id")}</th>
                    <th className={styles.th}>{t("paymentsPage.date")}</th>
                    <th className={styles.th}>{t("paymentsPage.user")}</th>
                    <th className={styles.th}>{t("paymentsPage.type")}</th>
                    <th className={styles.th}>{t("paymentsPage.item")}</th>
                    <th className={styles.th}>{t("paymentsPage.method")}</th>
                    <th className={styles.th}>{t("paymentsPage.amount")}</th>
                    <th className={styles.th}>{t("paymentsPage.currency")}</th>
                    <th className={styles.th}>{t("paymentsPage.platform_fee")}</th>
                    <th className={styles.th}>{t("paymentsPage.net_amount")}</th>
                    <th className={styles.th}>{t("paymentsPage.status")}</th>
                    <th className={styles.th}>{t("paymentsPage.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className={styles.rowHover}>
                      <td className={`${styles.td} ${styles.mono}`}>{txn.id}</td>
                      <td className={styles.td}>{formatDateTime(txn.date)}</td>
                      <td className={styles.td}>
                        <div className={styles.actionLinks}>
                          <span className={styles.cardTitle} style={{ fontSize: "0.95rem" }}>
                            {txn.user}
                          </span>
                          {txn.role && <span className={styles.roleChip}>{txn.role}</span>}
                        </div>
                      </td>
                      <td className={styles.td}>{getItemTypeLabel(txn.type)}</td>
                      <td className={styles.td}>{txn.itemTitle || "—"}</td>
                      <td className={styles.td}>{txn.method}</td>
                      <td className={`${styles.td} ${styles.money}`}>
                        {formatAmount(txn.amount, txn.currency)}
                      </td>
                      <td className={styles.td}>{txn.currency}</td>
                      <td className={styles.td}>{formatAmount(txn.platformFee, txn.currency)}</td>
                      <td className={styles.td}>{formatAmount(txn.instructorAmount, txn.currency)}</td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${statusClass(txn.status)}`}>
                          {translateStatus(txn.status)}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionLinks}>
                          <button
                            onClick={() => handleViewTransaction(txn)}
                            className={styles.actionButton}
                          >
                            {t("paymentsPage.view")}
                          </button>
                          {canManagePayments && (
                            <button
                              onClick={() => handleRefundTransaction(txn)}
                              disabled={processingRefundId === txn.id}
                              className={`${styles.actionButton} ${styles.dangerAction} ${
                                processingRefundId === txn.id ? styles.disabled : ""
                              }`}
                            >
                              {processingRefundId === txn.id
                                ? t("paymentsPage.pending")
                                : t("paymentsPage.refund")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "methods":
        return (
          <div className={styles.section}>
            <div className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>{t("paymentsPage.tabs.methods")}</h2>
                <p className={styles.cardSubtitle}>{t("paymentsPage.manage_methods")}</p>
              </div>
              <button
                onClick={() => {
                  if (!ensureCanManagePayments()) return;
                  router.push("/dashboard/admin/payments/methods/create");
                }}
                disabled={!canManagePayments}
                className={`${styles.accentButton} ${!canManagePayments ? styles.disabled : ""}`}
              >
                <FaPlus /> {t("paymentsPage.add_new")}
              </button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>{t("paymentsPage.name")}</th>
                    <th className={styles.th}>{t("paymentsPage.type")}</th>
                    <th className={styles.th}>{t("paymentsPage.status")}</th>
                    <th className={styles.th}>{t("paymentsPage.default")}</th>
                    <th className={styles.th}>{t("paymentsPage.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((method) => (
                    <tr key={method.id} className={styles.rowHover}>
                      <td className={styles.td}>
                        <div className={styles.actionLinks}>
                          <span>
                            {method.name === "Stripe" && "💳"}
                            {method.name === "PayPal" && "🅿️"}
                            {method.name === "Bank Transfer" && "🏦"}
                            {method.name === "Crypto Wallet" && "₿"} {method.name}
                          </span>
                          {method.is_default && <FaStar className={styles.pillIcon} color="#f59e0b" />}
                        </div>
                      </td>
                      <td className={styles.td}>{method.type}</td>
                      <td className={styles.td}>
                        <button
                          onClick={() => canManagePayments && toggleStatus(method.id)}
                          disabled={!canManagePayments}
                          className={`${styles.iconButton} ${!canManagePayments ? styles.disabled : ""}`}
                          aria-label={t("paymentsPage.status")}
                        >
                          {method.active ? (
                            <FaToggleOn color="#16a34a" size={22} />
                          ) : (
                            <FaToggleOff color="#9ca3af" size={22} />
                          )}
                        </button>
                      </td>
                      <td className={styles.td}>
                        <button
                          onClick={() => canManagePayments && toggleDefault(method.id)}
                          disabled={!canManagePayments}
                          className={`${styles.iconButton} ${!canManagePayments ? styles.disabled : ""}`}
                          aria-label={t("paymentsPage.default")}
                        >
                          {method.is_default ? (
                            <FaToggleOn color="#f59e0b" size={22} />
                          ) : (
                            <FaToggleOff color="#9ca3af" size={22} />
                          )}
                        </button>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionRow}>
                          {method.configurable && method.configPath && (
                            <button
                              onClick={() => {
                                if (!ensureCanManagePayments()) return;
                                router.push(method.configPath);
                              }}
                              disabled={!canManagePayments}
                              className={`${styles.primaryButton} ${
                                !canManagePayments ? styles.disabled : ""
                              }`}
                            >
                              {t("paymentsPage.configure")}
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(method.id)}
                            disabled={!canManagePayments}
                            className={`${styles.dangerButton} ${
                              !canManagePayments ? styles.disabled : ""
                            }`}
                          >
                            {t("delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "configuration": {
        if (!canManagePayments) {
          return (
            <div className={styles.card}>
              <p className={styles.cardSubtitle}>{managePermissionError}</p>
            </div>
          );
        }
        const configDisabled = !canManagePayments;
        return (
          <div className={styles.section}>
            <h2 className={styles.cardTitle}>{t("paymentsPage.configuration_title")}</h2>

            <div className={styles.card}>
              <div className={styles.section}>
                <div>
                  <label className={styles.cardTitle}>{t("paymentsPage.default_currency")}</label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className={`${styles.select} ${styles.inputNarrow}`}
                    disabled={configDisabled}
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                  {errors.currency && <p className={styles.errorText}>{errors.currency}</p>}
                </div>

                <div>
                  <label className={styles.cardTitle}>{t("paymentsPage.minimum_payout_amount")}</label>
                  <div className={styles.actionRow}>
                    <input
                      type="number"
                      name="minimumPayoutAmount"
                      value={form.minimumPayoutAmount}
                      min={0}
                      step="0.01"
                      onChange={handleChange}
                      className={`${styles.input} ${styles.inputNarrow}`}
                      disabled={configDisabled}
                    />
                    <span className={styles.helperText}>{form.currency}</span>
                  </div>
                  <p className={styles.helperText}>{t("paymentsPage.minimum_payout_hint")}</p>
                  {errors.minimumPayoutAmount && (
                    <p className={styles.errorText}>{errors.minimumPayoutAmount}</p>
                  )}
                </div>

                <div className={styles.section}>
                  <label className={styles.cardTitle}>{t("paymentsPage.platform_commission")}</label>
                  <div className={styles.gridTwo}>
                    {Object.entries(form.platformCut).map(([key, val]) => (
                      <div key={key}>
                        <label className={styles.cardSubtitle}>
                          {t(`paymentsPage.item_types.${key}`, key)}
                        </label>
                        <input
                          type="number"
                          name={`platformCut.${key}`}
                          value={val}
                          min={0}
                          max={100}
                          onChange={handleChange}
                          className={styles.input}
                          disabled={configDisabled}
                        />
                        {errors[`platformCut.${key}`] && (
                          <p className={styles.errorText}>{errors[`platformCut.${key}`]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <label className={styles.cardTitle}>{t("paymentsPage.invoice_settings")}</label>
                  <input
                    type="text"
                    placeholder={t("paymentsPage.logo_url")}
                    name="invoice.logoUrl"
                    value={form.invoice.logoUrl}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={configDisabled}
                  />
                  <textarea
                    placeholder={t("paymentsPage.invoice_footer_text")}
                    name="invoice.footerText"
                    value={form.invoice.footerText}
                    onChange={handleChange}
                    className={styles.textarea}
                    rows={3}
                    disabled={configDisabled}
                  />
                  <label className={styles.inlineCheckbox}>
                    <input
                      type="checkbox"
                      name="invoice.autoEmail"
                      checked={form.invoice.autoEmail}
                      onChange={handleChange}
                      disabled={configDisabled}
                    />
                    {t("paymentsPage.auto_send_receipt")}
                  </label>
                </div>

                <div className={styles.section}>
                  <label className={styles.cardTitle}>{t("paymentsPage.refund_policy")}</label>
                  <textarea
                    name="refundPolicy"
                    value={form.refundPolicy}
                    onChange={handleChange}
                    className={styles.textarea}
                    rows={4}
                    disabled={configDisabled}
                  />
                  {errors.refundPolicy && <p className={styles.errorText}>{errors.refundPolicy}</p>}
                </div>

                <button
                  onClick={handleSave}
                  disabled={Object.keys(errors).length > 0 || configDisabled}
                  className={`${styles.primaryButton} ${
                    Object.keys(errors).length > 0 || configDisabled ? styles.disabled : ""
                  }`}
                >
                  {t("paymentsPage.save_configuration")}
                </button>
              </div>
            </div>
          </div>
        );
      }

      case "payouts":
        return (
          <div className={styles.section}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t("paymentsPage.instructor_payouts")}</h2>
              <button className={styles.primaryButton}>{t("paymentsPage.export_csv")}</button>
            </div>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>{t("paymentsPage.payout_id")}</th>
                    <th className={styles.th}>{t("paymentsPage.date")}</th>
                    <th className={styles.th}>{t("paymentsPage.instructor")}</th>
                    <th className={styles.th}>{t("paymentsPage.amount")}</th>
                    <th className={styles.th}>{t("paymentsPage.currency")}</th>
                    <th className={styles.th}>{t("paymentsPage.status")}</th>
                    <th className={styles.th}>{t("paymentsPage.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className={styles.rowHover}>
                      <td className={`${styles.td} ${styles.mono}`}>{p.id}</td>
                      <td className={styles.td}>{formatDateTime(p.displayDate)}</td>
                      <td className={styles.td}>{p.instructorDisplay}</td>
                      <td className={`${styles.td} ${styles.money}`}>
                        {formatAmount(p.amount, p.currency)}
                      </td>
                      <td className={styles.td}>{p.currency || form.currency}</td>
                      <td className={styles.td}>
                        <span className={`${styles.statusBadge} ${statusClass(p.status)}`}>
                          {translateStatus(p.status)}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div className={styles.actionLinks}>
                          {p.status === "pending" && (
                            <>
                              <button
                                onClick={() => canManagePayments && updateStatus(p.id, "paid")}
                                disabled={!canManagePayments}
                                className={`${styles.actionButton} ${
                                  !canManagePayments ? styles.disabled : ""
                                }`}
                              >
                                {t("paymentsPage.mark_paid")}
                              </button>
                              <button
                                onClick={() => canManagePayments && updateStatus(p.id, "rejected")}
                                disabled={!canManagePayments}
                                className={`${styles.actionButton} ${styles.dangerAction} ${
                                  !canManagePayments ? styles.disabled : ""
                                }`}
                              >
                                {t("paymentsPage.reject")}
                              </button>
                            </>
                          )}
                          {p.status === "rejected" && (
                            <button
                              onClick={() => canManagePayments && updateStatus(p.id, "pending")}
                              disabled={!canManagePayments}
                              className={`${styles.actionButton} ${styles.mutedAction} ${
                                !canManagePayments ? styles.disabled : ""
                              }`}
                            >
                              {t("paymentsPage.reopen")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "bankTransfers":
        return (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>{t("paymentsPage.user")}</th>
                  <th className={styles.th}>{t("paymentsPage.order_id")}</th>
                  <th className={styles.th}>{t("paymentsPage.amount")}</th>
                  <th className={styles.th}>Receipt</th>
                  <th className={styles.th}>{t("paymentsPage.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {bankTransfers.map((bt) => (
                  <tr key={bt.id} className={styles.rowHover}>
                    <td className={styles.td}>{bt.student_name || bt.student?.name || bt.user_name}</td>
                    <td className={styles.td}>{bt.reference_id || bt.order_id || bt.id}</td>
                    <td className={`${styles.td} ${styles.money}`}>
                      {formatAmount(bt.amount, bt.currency)}
                    </td>
                    <td className={styles.td}>
                      {bt.receipt_url && (
                        <img src={bt.receipt_url} alt="receipt" className={styles.imageThumb} />
                      )}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actionLinks}>
                        <button
                          onClick={() => canManagePayments && handleApprove(bt.id)}
                          disabled={!canManagePayments}
                          className={`${styles.actionButton} ${
                            !canManagePayments ? styles.disabled : ""
                          }`}
                        >
                          {t("paymentsPage.approve")}
                        </button>
                        <button
                          onClick={() => canManagePayments && handleReject(bt.id)}
                          disabled={!canManagePayments}
                          className={`${styles.actionButton} ${styles.dangerAction} ${
                            !canManagePayments ? styles.disabled : ""
                          }`}
                        >
                          {t("paymentsPage.reject")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout title={t("paymentsPage.title")}>
      <div className={styles.page}>
        <div className={styles.tabBar}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`${styles.tabButton} ${
                activeTab === tab.key ? styles.tabButtonActive : ""
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
        <div className={styles.tabContent}>{renderTabContent()}</div>
      </div>
    </AdminLayout>
  );
}

const ProtectedAdminPaymentsPage = withAuthProtection(AdminPaymentsPage, {
  permissions: [ADMIN_PERMISSIONS.PAYMENTS.VIEW],
});

export default ProtectedAdminPaymentsPage;

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
