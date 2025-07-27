import PageHead from "@/components/common/PageHead";
import Link from "next/link";
import StudentLayout from "@/components/layouts/StudentLayout";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";

export default function StudentSupportHome() {
  const { t } = useTranslation('dashboard');

  const cards = [
    {
      href: "/support",
      emoji: "📚",
      title: t('help_center'),
      description: t('help_center_desc'),
    },
    {
      href: "/support/submit",
      emoji: "📝",
      title: t('submit_ticket'),
      description: t('submit_ticket_desc'),
    },
    {
      href: "/dashboard/student/support/my-tickets",
      emoji: "📄",
      title: t('my_tickets'),
      description: t('my_tickets_desc'),
    },
  ];

  return (
    <StudentLayout>
      <PageHead title={t('support_center')} />
      <div className="px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('support_center')}</h1>
          <p className="text-gray-600 mt-2 text-sm">
            {t('support_center_intro')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="block border border-gray-200 bg-white hover:bg-gray-50 shadow-sm rounded-2xl p-6 transition"
            >
              <h2 className="text-lg font-semibold text-yellow-600 mb-1">
                {card.emoji} {card.title}
              </h2>
              <p className="text-gray-600 text-sm">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </StudentLayout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
