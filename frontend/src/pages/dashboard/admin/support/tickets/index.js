import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";
import { FiSearch, FiFilter, FiRefreshCw, FiPlus, FiCalendar } from "react-icons/fi";

import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import TicketCard from "@/components/support/TicketCard";
import { fetchAllTickets } from "@/services/supportService";
import styles from "@/components/support/SupportDashboard.module.scss";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [search, setSearch] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useSupportTranslation();
  const router = useRouter();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllTickets({
        status: status || undefined,
        priority: priority || undefined,
        search: search || undefined,
        ticketNumber: ticketNumber || undefined,
        dateRange: dateRange || undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setStatus("");
    setPriority("");
    setSearch("");
    setTicketNumber("");
    setDateRange("");
    load();
  };

  return (
    <AdminLayout>
      <PageHead title={t("support_center")} />

      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t("support_center")}</h1>
            <p className={styles.subtitle}>{t("manage_all_support_tickets")}</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.primaryButton}>
              <FiPlus />
              {t("new_ticket")}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGrid}>
            <div>
              <label className={styles.label}>{t("status")}</label>
              <div className={styles.inputWithIcon}>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={styles.select}
                >
                  <option value="">{t("all_statuses")}</option>
                  <option value="open">{t("open")}</option>
                  <option value="pending">{t("pending")}</option>
                  <option value="resolved">{t("resolved")}</option>
                  <option value="closed">{t("closed")}</option>
                </select>
                <FiFilter className={styles.inputIcon} />
              </div>
            </div>

            <div>
              <label className={styles.label}>{t("priority")}</label>
              <div className={styles.inputWithIcon}>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={styles.select}
                >
                  <option value="">{t("all_priorities")}</option>
                  <option value="low">{t("low")}</option>
                  <option value="medium">{t("medium")}</option>
                  <option value="high">{t("high")}</option>
                  <option value="urgent">{t("urgent")}</option>
                </select>
                <FiFilter className={styles.inputIcon} />
              </div>
            </div>

            <div>
              <label className={styles.label}>{t("date_range")}</label>
              <div className={styles.inputWithIcon}>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className={styles.select}
                >
                  <option value="">{t("all_time")}</option>
                  <option value="today">{t("today")}</option>
                  <option value="week">{t("this_week")}</option>
                  <option value="month">{t("this_month")}</option>
                  <option value="year">{t("this_year")}</option>
                </select>
                <FiCalendar className={styles.inputIcon} />
              </div>
            </div>

            <div>
              <label className={styles.label}>{t("ticket_id")}</label>
              <input
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && load()}
                className={styles.input}
                placeholder="#"
              />
            </div>

            <div className={styles.filterWide}>
              <label className={styles.label}>{t("search")}</label>
              <div className={styles.inputWithIcon}>
                <FiSearch className={styles.inputIcon} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={styles.input}
                  placeholder={`${t("search")}...`}
                  onKeyPress={(e) => e.key === 'Enter' && load()}
                />
              </div>
            </div>
          </div>

          <div className={styles.actionsRow}>
            <button
              onClick={resetFilters}
              className={styles.ghostButton}
            >
              <FiRefreshCw />
              {t("reset")}
            </button>
            <button
              onClick={load}
              disabled={isLoading}
              className={styles.primaryButton}
            >
              {isLoading ? (
                <>
                  <span className={styles.miniSpinner} aria-hidden />
                  {t("loading")}...
                </>
              ) : (
                <>
                  <FiFilter />
                  {t("apply_filters")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className={styles.listShell}>
          {isLoading && tickets.length === 0 ? (
            <div className={styles.stateBox}>
              <div className={styles.spinner} aria-label={t("loading")} />
            </div>
          ) : tickets.length === 0 ? (
            <div className={styles.stateBox}>
              <div className={styles.emptyIcon}>•</div>
              <h3 className={styles.emptyTitle}>{t("no_tickets_found")}</h3>
              <p className={styles.emptyText}>{t("try_changing_filters")}</p>
              <button onClick={resetFilters} className={styles.primaryButton}>
                <FiRefreshCw />
                {t("reset_filters")}
              </button>
            </div>
          ) : (
            <div className={styles.listContent}>
              <ul className={styles.ticketList}>
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <TicketCard
                      ticket={ticket}
                      onClick={() =>
                        router.push(`/dashboard/admin/support/tickets/${ticket.id}`)
                      }
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tickets.length > 0 && (
            <div className={styles.paginationBar}>
              <p className={styles.subtitle} style={{ margin: 0 }}>
                {t("showing")} <span className={styles.paginationStrong}>1</span> {t("to")}{" "}
                <span className={styles.paginationStrong}>{tickets.length}</span> {t("of")}{" "}
                <span className={styles.paginationStrong}>{tickets.length}</span> {t("results")}
              </p>
              <div className={styles.pagination}>
                <button type="button" className={styles.pageButton} aria-label={t("previous")}>
                  <span className={styles.srOnly}>{t("previous")}</span>
                  &larr;
                </button>
                <button type="button" className={`${styles.pageButton} ${styles.pageButtonActive}`}>
                  1
                </button>
                <button type="button" className={styles.pageButton}>2</button>
                <button type="button" className={styles.pageButton} aria-label={t("next")}>
                  <span className={styles.srOnly}>{t("next")}</span>
                  &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
