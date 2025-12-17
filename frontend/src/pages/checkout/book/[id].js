import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styles from '../../payments/payments.module.scss';

export default function BookCheckoutRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      router.replace(`/payments/checkout?itemType=book&itemId=${id}`);
    }
  }, [id, router]);

  return <p className={styles.state}>Redirecting...</p>;
}
