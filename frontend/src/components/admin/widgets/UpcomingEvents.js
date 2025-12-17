const events = [
  { title: "React Bootcamp", date: "Tomorrow 10AM" },
  { title: "Python Live", date: "April 18, 2PM" },
  { title: "UX Fundamentals", date: "April 20, 5PM" },
];
import styles from "./WidgetCards.module.scss";

export default function UpcomingEvents() {
  return (
    <div className={styles.card}>
      <p className={styles.title}>📅 Upcoming Classes</p>
      <ul className={styles.list}>
        {events.map((e, i) => (
          <li key={i}>✅ {e.title} – {e.date}</li>
        ))}
      </ul>
    </div>
  );
}
