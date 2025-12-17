// components/admin/WelcomeBanner.js
import styles from "./AdminCards.module.scss";

export default function WelcomeBanner({ name = "Admin" }) {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome, {name} 👋</h1>
        <p className={styles.timestamp}>Today is {today}</p>
      </div>
    );
  }
  
