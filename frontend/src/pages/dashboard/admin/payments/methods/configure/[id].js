import AdminLayout from "@/components/layouts/AdminLayout";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../../../next-i18next.config.js";
import PaymentProviderConfig from "@/components/payments/PaymentProviderConfig";
import styles from "../../payments.module.scss";

export default function ConfigurePaymentMethodPage() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('dashboard');

  return (
    <AdminLayout title={t('configure_payment_method')}>
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>
              {t('configure_payment_method_title', { id })}
            </h1>
          </div>
          <div className={styles.section}>
            <PaymentProviderConfig providerId={id} />
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
