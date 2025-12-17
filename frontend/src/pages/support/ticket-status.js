import { useEffect, useState } from "react";
import PageHead from "@/components/common/PageHead";
import Navbar from "@/components/website/sections/Navbar";
import Footer from "@/components/website/sections/Footer";
import { fetchMyTickets } from "@/services/supportService";
import styles from "./support.module.scss";

export default function TicketStatusPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchMyTickets()
      .then((data) => {
        if (isMounted) setTickets(data);
      })
      .catch(() => isMounted && setError("Failed to load tickets"))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <PageHead title="My Support Tickets" />
      <Navbar />
      <main className={styles.container}>
        <h1 className={styles.title}>
          My Support Tickets
        </h1>

        {loading ? (
          <p className={styles.state}>Loading...</p>
        ) : error ? (
          <p className={styles.state} style={{ color: "#f87171" }}>{error}</p>
        ) : tickets.length === 0 ? (
          <p className={styles.state}>No support tickets found.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Ticket ID</th>
                  <th className={styles.th}>Subject</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Created</th>
                  <th className={styles.th}>Last Updated</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className={styles.row}
                  >
                    <td className={styles.td} style={{ fontFamily: "monospace" }}>{ticket.id}</td>
                    <td className={styles.td}>{ticket.subject}</td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.badge} ${
                          ticket.status === "resolved"
                            ? styles.badgeSuccess
                            : ticket.status === "open"
                            ? styles.badgeWarning
                            : styles.badgeError
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className={styles.td} style={{ color: "#9ca3af" }}>{ticket.createdAt}</td>
                    <td className={styles.td} style={{ color: "#9ca3af" }}>{ticket.lastUpdated}</td>
                    <td className={styles.td}>
                      <a
                        href={`/support/tickets/${ticket.id}`}
                        className={styles.link}
                      >
                        View Details
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
