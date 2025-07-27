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
  const { t } = useTranslation("dashboard");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await fetchAllTickets();
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
          {/* Optional future: Add filters or button to create ticket */}
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
