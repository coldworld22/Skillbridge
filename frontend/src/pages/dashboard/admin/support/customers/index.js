import AdminLayout from "@/components/layouts/AdminLayout";
import PageHead from "@/components/common/PageHead";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../next-i18next.config.js";

export default function AdminSupportCustomers() {
  const { t } = useTranslation('dashboard');
  return (
    <AdminLayout>
      <PageHead title={t('customer_management')} />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{t('customer_management')}</h1>
        <p className="text-gray-600">{t('under_construction')}</p>
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
