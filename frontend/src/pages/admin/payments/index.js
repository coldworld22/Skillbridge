// Admin Payment Methods List Page
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMethods } from '@/services/admin/paymentMethodService';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';
import styles from "../admin.module.scss";

export default function AdminPaymentsPage() {
  const { t } = useTranslation('dashboard');
  const [methods, setMethods] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMethods();
        setMethods(data);
      } catch (err) {
        console.error('Failed to load payment methods', err);
      }
    };
    load();
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('manage_payment_gateways')}</h1>
      <ul className={styles.list}>
        {methods.map((gw) => (
          <li key={gw.id} className={styles.listItem}>
            <div>
              <h2 className={styles.itemTitle}>{gw.name}</h2>
              <p className={gw.active ? styles.statusActive : styles.statusInactive}>
                {gw.active ? t('payment_enabled') : t('payment_disabled')}
              </p>
            </div>
            <Link href={`/admin/payments/edit/${gw.id}`}>
              <span className={styles.pillAction}>{t('edit')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}
