import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import TicketCard from "@/components/support/TicketCard";
import { fetchAllTickets } from "@/services/supportService";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const { t } = useTranslation("dashboard");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchAllTickets({
        status: status || undefined,
        search: search || undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error("Failed to fetch tickets", err);
    }
  };

  return (
    <AdminLayout>
      <PageHead title={t("support_center")} />

      <div className="px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("support_center")}
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("status")}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">{t("all")}</option>
              <option value="open">{t("open")}</option>
              <option value="resolved">{t("resolved")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("search")}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder={t("search")}
            />
          </div>
          <button
            onClick={load}
            className="px-4 py-2 rounded bg-yellow-500 text-black hover:bg-yellow-600"
          >
            {t("apply")}
          </button>
        </div>

        {tickets.length === 0 ? (
          <p className="text-gray-500">{t("no_tickets_found")}</p>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() =>
                  (window.location.href = `/dashboard/admin/support/tickets/${ticket.id}`)
                }
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["dashboard"], nextI18NextConfig)),
    },
  };
}
