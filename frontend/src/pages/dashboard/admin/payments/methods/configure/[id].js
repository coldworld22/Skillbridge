import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../../next-i18next.config.js";
import PaymentProviderConfig from "@/components/payments/PaymentProviderConfig";

export default function ConfigurePaymentMethodPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('dashboard');

  return (
    <AdminLayout title={t('configure_payment_method')}>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">
          {t('configure_payment_method_title', { id })}
        </h1>
        <PaymentProviderConfig providerId={id} />
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
