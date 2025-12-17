import Link from 'next/link';
import PaymentMethodList from '@/components/payments/PaymentMethodList';
import styles from './paymentMethods.module.scss';

export default function SavedPaymentMethodsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Payment Methods</h1>
        <Link href="/profile/payment-methods/add">
          <span className={styles.add}>
            Add Method
          </span>
        </Link>
      </div>
      <PaymentMethodList />
    </div>
  );
}
