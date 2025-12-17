import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { FaArrowLeft, FaDownload, FaPrint } from "react-icons/fa";
import QRCode from "react-qr-code";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { uploadReceipt } from "@/services/student/paymentService";
import {
  fetchInvoiceByPaymentId,
  downloadInvoice,
} from "@/services/student/invoiceService";
import { formatCurrency } from "@/utils/currency";
import styles from "./invoice.module.scss";

const formatDate = (value, fallback = "—") =>
  value ? dayjs(value).format("MMM D, YYYY") : fallback;

const statusBadgeClasses = {
  paid: "badgePaid",
  pending: "badgePending",
  awaiting_approval: "badgeAwaiting_approval",
  awaiting_payment: "badgeAwaiting_payment",
  failed: "badgeFailed",
  rejected: "badgeRejected",
  refunded: "badgeRefunded",
};

const InfoTile = ({ label, value }) => (
  <div className={styles.tile}>
    <p className={styles.tileLabel}>
      {label}
    </p>
    <p className={styles.tileValue}>{value || "—"}</p>
  </div>
);

export default function InvoicePage() {
  const router = useRouter();
  const { id } = router.query;
  const [invoiceData, setInvoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchInvoiceByPaymentId(id);
        if (!active) return;
        setInvoiceData(data);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load invoice", err);
        setError("We couldn't find an invoice for this payment yet.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const downloadPDF = () => {
    if (invoiceData?.id) {
      downloadInvoice(invoiceData.id);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const derived = useMemo(() => {
    if (!invoiceData) {
      return {
        invoiceInfo: {},
        paymentInfo: {},
        userInfo: {},
        settingsInfo: {},
        itemInfo: {},
      };
    }
    const details = invoiceData.details || {};
    return {
      invoiceInfo: details.invoice || {},
      paymentInfo: details.payment || {},
      userInfo: details.user || {},
      settingsInfo: details.settings || {},
      itemInfo: details.item || {},
    };
  }, [invoiceData]);

  const { invoiceInfo, paymentInfo, userInfo, settingsInfo, itemInfo } = derived;
  const companyName =
    settingsInfo.companyName || settingsInfo.appName || "SkillBridge";
  const companyAddress = settingsInfo.companyAddress || "";
  const companyPhone = settingsInfo.companyPhone || "";
  const supportEmail =
    settingsInfo.supportEmail ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    "support@example.com";
  const invoiceNumber =
    invoiceInfo.number || invoiceInfo.id || invoiceData?.id || "—";
  const currency =
    invoiceInfo.currency || invoiceData?.currency || paymentInfo.currency || "USD";
  const subtotal = Number(
    invoiceInfo.subtotal ??
      invoiceData?.amount ??
      paymentInfo.amount ??
      itemInfo.price ??
      0
  );
  const discount = Number(
    invoiceData?.discount ??
      invoiceData?.discount_amount ??
      invoiceInfo.discount ??
      0
  );
  const total = Number(
    invoiceInfo.total ??
      invoiceData?.total ??
      invoiceData?.amount ??
      paymentInfo.amount ??
      subtotal
  );
  const statusRaw =
    paymentInfo.status || invoiceData?.status || "pending_payment";
  const status = statusRaw.toLowerCase();
  const statusLabel = status.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
  const issuedDate =
    invoiceInfo.issue_date ||
    paymentInfo.paid_at ||
    invoiceData?.paid_at ||
    invoiceData?.created_at;
  const dueDate =
    invoiceInfo.due_date ||
    paymentInfo.next_due_date ||
    invoiceData?.next_due_date ||
    null;
  const methodName =
    paymentInfo.method_name ||
    invoiceData?.payment_method ||
    invoiceData?.method ||
    "—";
  const normalizedMethod = methodName.toLowerCase();
  const isBankTransfer = normalizedMethod.includes("bank");
  const showUpload = isBankTransfer && status !== "paid";
  const paymentId = paymentInfo.id || invoiceData?.payment_id || "—";
  const referenceId = paymentInfo.reference_id || invoiceData?.reference_id || "—";
  const formattedSubtotal = formatCurrency(subtotal, { currency });
  const formattedTotal = formatCurrency(total, { currency });
  const formattedDiscount =
    discount > 0 ? formatCurrency(discount, { currency }) : null;
  const invoiceTitle =
    itemInfo?.title ||
    itemInfo?.name ||
    paymentInfo.item_type ||
    "Payment";
  const quantity = Number(itemInfo?.quantity || 1);
  const unitPrice = formatCurrency(itemInfo?.price ?? subtotal, { currency });
  const qrValue = `Invoice:${invoiceNumber}|Total:${total}|Currency:${currency}`;

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadReceipt(file);
      alert("Receipt uploaded");
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className={styles.state}>
          <p className={styles.tileLabel}>Loading Invoice</p>
          <p className={styles.stateText}>
            Please hold on while we prepare your invoice details.
          </p>
        </div>
      );
    }

    if (error || !invoiceData) {
      return (
        <div className={styles.state}>
          <p className={styles.stateTitle}>
            Unable to load invoice
          </p>
          <p className={styles.stateText}>{error}</p>
          <div className={styles.actions + " " + styles.noPrint}>
            <button
              onClick={() => router.back()}
              className={styles.button}
            >
              <FaArrowLeft /> Go back
            </button>
            <a
              href={`mailto:${supportEmail}`}
              className={`${styles.button} ${styles.buttonAccent}`}
            >
              Contact support
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.sheet}>
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <p className={styles.tileLabel}>
              Invoice
            </p>
            <h1 className={styles.heroTitle}>
              #{invoiceNumber}
            </h1>
            <p className={styles.subtitle}>
              {companyName}
              {companyAddress ? ` • ${companyAddress}` : ""}
            </p>
          </div>
          <div className={styles.logoRow}>
            {settingsInfo.logoUrl ? (
              <img
                src={settingsInfo.logoUrl}
                alt={`${companyName} logo`}
                className={styles.logoImg}
              />
            ) : (
              <div className={styles.logoBox}>
                {companyName}
              </div>
            )}
            <span
              className={`${styles.badge} ${styles[statusBadgeClasses[status] || "badgeDefault"]}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        <div className={styles.gridTwo} style={{ marginTop: "1rem" }}>
          <InfoTile label="Invoice number" value={`#${invoiceNumber}`} />
          <InfoTile label="Issued on" value={formatDate(issuedDate)} />
          <InfoTile
            label="Due date"
            value={dueDate ? formatDate(dueDate) : "Upon receipt"}
          />
          <InfoTile label="Reference" value={referenceId} />
        </div>

        <div className={styles.section}>
          <section className={styles.sectionCard}>
            <p className={styles.sectionTitle}>
              Billed to
            </p>
            <p className={styles.tileValue} style={{ marginTop: "0.5rem" }}>
              {userInfo.full_name || userInfo.name || "Student"}
            </p>
            <div className={styles.sectionText}>
              {userInfo.email && <p>{userInfo.email}</p>}
              {userInfo.phone && <p>{userInfo.phone}</p>}
            </div>
          </section>
          <section className={styles.sectionCard}>
            <p className={styles.sectionTitle}>
              Payment details
            </p>
            <div className={styles.sectionText}>
              <p style={{ marginBottom: "0.25rem" }}>
                <span className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none" }}>Payment ID:</span>{" "}
                {paymentId}
              </p>
              <p style={{ marginBottom: "0.25rem" }}>
                <span className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none" }}>Method:</span>{" "}
                {methodName || "—"}
              </p>
              <p style={{ marginBottom: "0.25rem" }}>
                <span className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none" }}>Status:</span>{" "}
                {statusLabel}
              </p>
              <p>
                <span className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none" }}>Amount:</span>{" "}
                {formattedTotal}
              </p>
            </div>
          </section>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Description</th>
                <th className={styles.th} style={{ textAlign: "center" }}>Qty</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Unit price</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              <tr>
                <td className={styles.td}>
                  <p style={{ fontWeight: 800 }}>{invoiceTitle}</p>
                  {itemInfo.type && (
                    <p className={styles.tileLabel} style={{ marginTop: "0.25rem" }}>
                      {itemInfo.type}
                    </p>
                  )}
                </td>
                <td className={styles.td} style={{ textAlign: "center", color: "#475569" }}>{quantity}</td>
                <td className={styles.td} style={{ textAlign: "right", fontWeight: 600 }}>
                  {unitPrice}
                </td>
                <td className={styles.td} style={{ textAlign: "right", fontWeight: 800 }}>
                  {formattedTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.summary}>
          <div className={styles.noteCard}>
            <p className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none" }}>Notes</p>
            <p className={styles.sectionText} style={{ marginTop: "0.35rem" }}>
              {settingsInfo.footerText ||
                "Thank you for learning with us. Need anything else? Just reply to this email."}
            </p>
          </div>
          <div className={styles.totalCard}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span className={styles.tileValue} style={{ fontSize: "1rem" }}>{formattedSubtotal}</span>
            </div>
            {formattedDiscount && (
              <div className={styles.totalRow} style={{ color: "#b91c1c" }}>
                <span>Discount</span>
                <span>-{formattedDiscount}</span>
              </div>
            )}
            <div className={styles.totalHighlight}>
              <div className={styles.totalRow} style={{ margin: 0 }}>
                <span>Total due</span>
                <span style={{ fontWeight: 800 }}>{formattedTotal}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.qrRow}>
          <div className={styles.qrCard}>
            <QRCode
              value={qrValue}
              size={110}
              fgColor="#0f172a"
              bgColor="transparent"
            />
            <div>
              <p className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none" }}>
                Scan to reference this invoice
              </p>
              <p className={styles.qrText}>
                Invoice #{invoiceNumber} • {formattedTotal}
              </p>
            </div>
          </div>
          <div className={`${styles.actions} ${styles.noPrint}`}>
            <button
              onClick={() => router.back()}
              className={styles.button}
            >
              <FaArrowLeft /> Back
            </button>
            <button
              onClick={handlePrint}
              className={`${styles.button} ${styles.buttonGhost}`}
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={downloadPDF}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              <FaDownload /> Download PDF
            </button>
          </div>
        </div>

        {isBankTransfer && (
          <div className={styles.bankPanel}>
            <div className={styles.actions} style={{ justifyContent: "space-between" }}>
              <p className={styles.tileValue} style={{ color: "#92400e" }}>
                Bank transfer instructions
              </p>
              {status !== "paid" && (
                <span className={styles.bankPill}>
                  Awaiting confirmation
                </span>
              )}
            </div>
            <div className={styles.bankGrid}>
              <p className={styles.bankText}>
                <span className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none", color: "#92400e" }}>Bank:</span>{" "}
                {invoiceData?.bankName ||
                  invoiceData?.bank_name ||
                  paymentInfo.bank_name ||
                  "—"}
              </p>
              <p className={styles.bankText}>
                <span className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none", color: "#92400e" }}>IBAN / Account:</span>{" "}
                {invoiceData?.iban ||
                  invoiceData?.bank_iban ||
                  paymentInfo.bank_iban ||
                  "—"}
              </p>
              <p className={styles.bankText}>
                <span className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none", color: "#92400e" }}>Reference:</span> {referenceId}
              </p>
              <p className={styles.bankText}>
                <span className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none", color: "#92400e" }}>Amount:</span> {formattedTotal}
              </p>
            </div>
            <p className={styles.bankText}>
              Email proof of payment to{" "}
              <a href={`mailto:${supportEmail}`} className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none", fontWeight: 800, color: "#0f172a", textDecoration: "underline" }}>
                {supportEmail}
              </a>{" "}
              and include the invoice number in the subject line.
            </p>
            {showUpload && (
              <div style={{ marginTop: "0.75rem" }}>
                <label className={styles.tileLabel} style={{ letterSpacing: 0, textTransform: "none", color: "#92400e" }}>
                  Upload transfer receipt
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleReceiptUpload}
                  className={styles.input}
                  style={{ marginTop: "0.35rem", background: "#fffbea", borderColor: "#fcd34d", color: "#92400e" }}
                />
              </div>
            )}
          </div>
        )}

        <div className={styles.footerBar}>
          <div>
            Need help?{" "}
            <a href={`mailto:${supportEmail}`} className={styles.tileValue} style={{ fontSize: "1rem", color: "#0f172a" }}>
              {supportEmail}
            </a>
          </div>
          {companyPhone && (
            <div className={styles.subtitle}>Call us: {companyPhone}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.noPrint}>
        <Navbar />
      </div>
      <main className={styles.shell}>
        {renderBody()}
      </main>
      <div className={styles.noPrint}>
        <Footer />
      </div>
    </div>
  );
}
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../next-i18next.config.js";

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"], nextI18NextConfig)),
    },
  };
}
