import PaymentMethodForm from '@/components/payments/PaymentMethodForm';
import styles from './paymentMethods.module.scss';

export default function AddPaymentMethodPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Add a New Payment Method</h1>
      <PaymentMethodForm />
    </div>
  );
}
