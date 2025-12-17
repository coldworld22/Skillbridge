import Link from "next/link";
import { useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";
import useLibraryStore from "@/store/libraryStore";
import styles from "./cart.module.scss";

const ConfirmationPage = () => {
  const fetchLibrary = useLibraryStore((state) => state.fetchLibrary);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  return (
    <div className={styles.confirmPage}>
      <FaCheckCircle className={styles.confirmIcon} />
      <h1 className={styles.confirmTitle}>✅ Order Confirmed!</h1>
      <p className={styles.confirmText}>Thank you for your purchase. A confirmation email has been sent.</p>
      <Link href="/">
        <button className={styles.homeBtn}>
          Return to Home
        </button>
      </Link>
    </div>
  );
};

export default ConfirmationPage;
