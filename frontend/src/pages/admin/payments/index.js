// Admin Payment Methods List Page
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { fetchMethods } from '@/services/admin/paymentMethodService';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../../next-i18next.config.js';

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{t('manage_payment_gateways')}</h1>
      <ul className="space-y-4">
        {methods.map((gw) => (
          <li key={gw.id} className="bg-white shadow p-4 rounded-xl flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">{gw.name}</h2>
              <p className={`text-sm ${gw.active ? 'text-green-600' : 'text-red-500'}`}>
                {gw.active ? t('payment_enabled') : t('payment_disabled')}
              </p>
            </div>
            <Link href={`/admin/payments/edit/${gw.id}`}>
              <span className="px-4 py-2 bg-yellow-400 text-white rounded-full hover:bg-yellow-500 transition cursor-pointer">{t('edit')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'dashboard'], nextI18NextConfig)),
    },
  };
}
