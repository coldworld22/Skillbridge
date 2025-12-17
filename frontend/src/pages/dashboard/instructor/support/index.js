import PageHead from "@/components/common/PageHead";
import Link from "next/link";
import InstructorLayout from "@/components/layouts/InstructorLayout";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import styles from "@/components/support/SupportDashboard.module.scss";

export default function InstructorSupportHome() {
  const { t } = useSupportTranslation();

  const cards = [
    {
      href: '/support/submit',
      emoji: '📝',
      title: t('submit_ticket'),
      description: t('submit_ticket_desc'),
    },
    {
      href: '/dashboard/instructor/support/my-tickets',
      emoji: '📄',
      title: t('my_tickets'),
      description: t('my_tickets_desc'),
    },
  ];

  return (
    <InstructorLayout>
      <PageHead title={t('support_center')} />
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('support_center')}</h1>
            <p className={styles.subtitle}>{t('support_center_intro')}</p>
          </div>
        </div>

        <div className={styles.cardGrid}>
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={styles.card}
            >
              <h2 className={styles.cardTitle}>
                {card.emoji} {card.title}
              </h2>
              <p className={styles.cardText}>{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </InstructorLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
