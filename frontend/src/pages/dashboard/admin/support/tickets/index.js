import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useEffect, useState } from "react";
import { fetchAllTickets } from "@/services/supportService";
import TicketCard from "@/components/support/TicketCard";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminSupportTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const { t } = useTranslation('dashboard');

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
      <PageHead title={t('support_center')} />
      <div className="px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('support_center')}</h1>
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => (window.location.href = `/dashboard/admin/support/tickets/${ticket.id}`)}
            />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
