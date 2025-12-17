import PageHead from "@/components/common/PageHead";
import AdminLayout from "@/components/layouts/AdminLayout";
import Link from "next/link";
import { FiInbox, FiBarChart2 } from "react-icons/fi";
import useSupportTranslation from "@/hooks/useSupportTranslation";
import { useEffect, useState } from "react";
import { fetchRecentActivity } from "@/services/supportService";
import formatRelativeTime from "@/utils/relativeTime";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import styles from "@/components/support/SupportDashboard.module.scss";

export default function AdminSupportHome() {
  const { t } = useSupportTranslation();
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    try {
      const data = await fetchRecentActivity();
      setActivity(data);
    } catch (err) {
      console.error('Failed to load activity', err);
    }
  };
  return (
    <AdminLayout>
      <PageHead title={t('support_dashboard')} />
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('support_dashboard')}</h1>
            <p className={styles.subtitle}>{t('manage_support')}</p>
          </div>
          
        </div>

        <div className={styles.cardGrid}>
          <Link
            href="/dashboard/admin/support/tickets"
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.cardIconBlue}`}>
                <FiInbox size={20} />
              </div>
              <h2 className={styles.cardTitle}>{t('manage_tickets')}</h2>
            </div>
            <p className={styles.cardText}>View, filter, and respond to all support requests.</p>
            <div className={styles.cardLink}>
              {t('view_all')}
              <svg className={styles.arrowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>


          <Link
            href="/dashboard/admin/support/analytics"
            className={styles.card}
          >
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.cardIconGreen}`}>
                <FiBarChart2 size={20} />
              </div>
              <h2 className={styles.cardTitle}>{t('support_analytics')}</h2>
            </div>
            <p className={styles.cardText}>View metrics and reports on support performance.</p>
            <div className={styles.cardLink}>
              {t('view_reports')}
              <svg className={styles.arrowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

        </div>

        {/* Recent Activity Section */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            {t('recent_activity')}
          </div>
          <div className={styles.activityList}>
            {activity.map((item) => (
              <div key={item.id} className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div>
                  <p className={styles.activityTitle}>New ticket #{item.id} created</p>
                  <p className={styles.activityText}>{item.subject}</p>
                  <p className={styles.activityMeta}>{formatRelativeTime(item.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.panelFooter}>
            <Link href="/dashboard/admin/support/tickets" className={styles.link}>
              {t('view_all')} →
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['dashboard'], nextI18NextConfig)),
    },
  };
}
