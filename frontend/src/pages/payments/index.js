// pages/payments/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchMyPayments } from "@/services/student/paymentService";
import styles from "./payments.module.scss";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyPayments();
        setPayments(Array.isArray(data) ? data : []);
      } catch (_) {
        setError("Failed to load payments");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const item = (p.item_name || p.tutorial || "").toLowerCase();
    return item.includes(searchTerm.toLowerCase());
  });

  const totalPaid = filteredPayments
    .filter((p) => (p.status || "").toLowerCase() === "paid")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalPages = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const exportToCSV = () => {
    const csvContent = [
      ["Item", "Amount", "Status", "Date"],
      ...filteredPayments.map((p) => [
        p.item_name || p.tutorial || "N/A",
        p.amount,
        p.status,
        p.date || p.created_at,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "payments.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 className={styles.title}>
            💳 Payment Management
          </h1>
          <p className={styles.subtitle}>Track all course payments made by users</p>
        </div>

        <div className={styles.card} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by item"
            className={styles.input}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1 1 16rem' }}
          />
          <button
            onClick={exportToCSV}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Export CSV
          </button>
        </div>

        <div className={styles.summary}>
          <h2 className={styles.sectionTitle}>
            Total Revenue: ${totalPaid}
          </h2>
          <p className={styles.muted}>
            Transactions: {filteredPayments.length}
          </p>
        </div>

        {loading ? (
          <div className={styles.state}>Loading...</div>
        ) : error ? (
          <div className={styles.statusError} style={{ padding: '2rem 0' }}>{error}</div>
        ) : filteredPayments.length === 0 ? (
          <div className={styles.state}>
            No payment records found.
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>#</th>
                  <th className={styles.th}>Item</th>
                  <th className={styles.th}>Amount</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className={styles.row}
                  >
                    <td className={styles.td}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                    <td className={styles.td} style={{ fontWeight: 700 }}>{payment.item_name || payment.tutorial || 'N/A'}</td>
                    <td className={styles.td} style={{ color: '#34d399', fontWeight: 800 }}>${payment.amount}</td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.statusBadge} ${
                          (payment.status || '').toLowerCase() === "paid"
                            ? styles.badgePaid
                            : styles.badgePending
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className={styles.td} style={{ color: '#9ca3af' }}>{payment.date || payment.created_at}</td>
                    <td className={styles.td}>
                      <Link href={`/payments/invoice/${payment.id}`} className={styles.link}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`${styles.pageButton} ${currentPage === i + 1 ? styles.pageButtonActive : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
