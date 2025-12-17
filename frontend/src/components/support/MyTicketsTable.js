import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMyTickets, deleteTicket } from "@/services/supportService";
import StatusBadge from "@/components/support/StatusBadge";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import styles from "./Ticket.module.scss";

export default function MyTicketsTable() {
  const { t } = useSupportTranslation();
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [numberFilter, setNumberFilter] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchMyTickets();
      setTickets(data);
      toast.success(t("tickets_loaded"));
    } catch (err) {
      toast.error(t("tickets_load_failed"));
      console.error("Failed to load tickets", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("confirm_delete_ticket"))) return;
    try {
      await deleteTicket(id);
      setTickets(tickets.filter((t) => t.id !== id));
      toast.success(t("ticket_deleted"));
    } catch (err) {
      toast.error(t("delete_failed"));
      console.error("Failed to delete ticket", err);
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      (statusFilter === "All" || ticket.status === statusFilter) &&
      (numberFilter === "" ||
        ticket.ticket_number?.toString().includes(numberFilter))
  );

  const formatCreatedAt = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

  return (
    <div style={{ padding: "2.5rem 1.5rem" }}>
      <div className={styles.cardHeader} style={{ flexWrap: "wrap", gap: "1rem", justifyContent: "space-between" }}>
        <h1 className={styles.tableTitle}>{t("my_tickets")}</h1>
        <div className={styles.controls}>
          <input
            type="text"
            value={numberFilter}
            onChange={(e) => setNumberFilter(e.target.value)}
            placeholder={t("ticket_number")}
            className={styles.controlInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.controlSelect}
          >
            <option value="All">{t("all_statuses")}</option>
            <option value="Open">{t("open")}</option>
            <option value="Pending">{t("pending")}</option>
            <option value="Resolved">{t("resolved")}</option>
            <option value="Closed">{t("closed")}</option>
          </select>
          <Link
            href="/support/submit"
            className={styles.controlButton}
          >
            {t("new_ticket")}
          </Link>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <p className={styles.muted} style={{ textAlign: "center" }}>{t("no_tickets")}</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>{t("ticket_id")}</th>
                <th className={styles.th}>{t("subject")}</th>
                <th className={styles.th}>{t("status")}</th>
                <th className={styles.th}>{t("created")}</th>
                <th className={styles.th}>{t("action")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={styles.trHover}
                >
                  <td className={styles.td}>
                    {ticket.ticket_number}
                  </td>
                  <td className={styles.td}>
                    {ticket.subject}
                  </td>
                  <td className={styles.td}>
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className={styles.td}>
                    {formatCreatedAt(ticket.createdAt || ticket.created_at)}
                  </td>
                  <td className={styles.td}>
                    <Link
                      href={`/support/tickets/${ticket.id}`}
                      className={styles.controlButton}
                    >
                      <FaEye /> {t("view_details")}
                    </Link>
                    {(["Resolved", "Closed"].includes(ticket.status)) && (
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className={styles.linkDanger}
                        style={{ marginLeft: "0.5rem" }}
                      >
                        <FaTrashAlt /> {t("delete_ticket")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
