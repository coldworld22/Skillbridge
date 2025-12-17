// Admin Edit Payment Provider Page
import { useRouter } from 'next/router';
import PaymentProviderConfig from '@/components/payments/PaymentProviderConfig';
import styles from "../../admin.module.scss";

export default function EditPaymentProviderPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Configure {id?.toUpperCase()} Settings</h1>
      <PaymentProviderConfig providerId={id} />
    </div>
  );
}
