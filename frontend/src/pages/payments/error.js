import { useRouter } from "next/router";
import { useEffect } from "react";
import styles from "./payments.module.scss";

export default function PaymentError() {
  const router = useRouter();
  const { reason = "Payment was cancelled or failed." } = router.query;

  // Optional auto-redirect after 10s
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     router.push("/payments/checkout");
  //   }, 10000);
  //   return () => clearTimeout(timer);
  // }, [router]);

  return (
    <div className={styles.page}>
      <main className={styles.mainNarrow}>
        <svg
          className={styles.errorIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>

        <h1 className={styles.heroTitle}>❌ Payment Failed</h1>
        <p className={styles.subtitle}>{reason}</p>

        <div className={styles.ctaRow} style={{ marginTop: '1rem' }}>
          <a href="/payments/checkout" className={`${styles.button} ${styles.buttonPrimary}`}>
            Retry Payment
          </a>
          <a href="/" className={`${styles.button} ${styles.buttonGhost}`}>
            Back to Home
          </a>
        </div>

        {/* Optional */}
        {/* <p className="text-sm text-gray-500 mt-4">You will be redirected shortly...</p> */}
      </main>
    </div>
  );
}
