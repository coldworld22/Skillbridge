import {
  FaCalendarCheck,
  FaCheckCircle,
  FaClipboardList,
  FaClock,
  FaTimesCircle,
} from 'react-icons/fa';
import styles from './BookingStats.module.scss';

export default function BookingStats({ bookings }) {
  const total = bookings.length;
  const pending = bookings.filter((b) => b.status === 'pending').length;
  const scheduled = bookings.filter((b) => b.status === 'approved').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;
  const cancelled = bookings.filter((b) => b.status === 'cancelled').length;

  const stats = [
    {
      label: 'Total',
      value: total,
      icon: FaClipboardList,
      accent: styles.blue,
      description: 'Across all statuses',
    },
    {
      label: 'Pending',
      value: pending,
      icon: FaClock,
      accent: styles.amber,
      description: 'Awaiting approval',
    },
    {
      label: 'Approved',
      value: scheduled,
      icon: FaCalendarCheck,
      accent: styles.indigo,
      description: 'Scheduled sessions',
    },
    {
      label: 'Completed',
      value: completed,
      icon: FaCheckCircle,
      accent: styles.emerald,
      description: 'Successfully finished',
    },
    {
      label: 'Cancelled',
      value: cancelled,
      icon: FaTimesCircle,
      accent: styles.rose,
      description: 'Cancelled bookings',
    },
  ];

  return (
    <div className={styles.grid}>
      {stats.map(({ label, value, icon: Icon, accent, description }) => (
        <div
          key={label}
          className={styles.card}
        >
          <span
            className={`${styles.icon} ${accent}`}
          >
            <Icon size={16} />
          </span>
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value}</p>
          <p className={styles.description}>{description}</p>
        </div>
      ))}
    </div>
  );
}
