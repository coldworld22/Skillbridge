import StatusBadge from '@/components/shared/ui/StatusBadge';
import styles from './BookingRow.module.scss';

export default function BookingRow({ booking, onView }) {
  return (
    <tr
      className={styles.row}
      onClick={onView}
    >
      <td className={`${styles.cell} ${styles.inline}`}>
        <img
          src={booking.student.avatar}
          className={styles.avatar}
          alt={`${booking.student.name} avatar`}
        />
        {booking.student.name}
      </td>
      <td className={`${styles.cell} ${styles.inline}`}>
        <img
          src={booking.instructor.avatar}
          className={styles.avatar}
          alt={`${booking.instructor.name} avatar`}
        />
        {booking.instructor.name}
      </td>
      <td className={styles.cell}>{booking.type}</td>
      <td className={`${styles.cell} ${styles.nowrap}`}>{booking.date}</td>
      <td className={`${styles.cell} ${styles.nowrap}`}>{booking.time}</td>
      <td className={`${styles.cell} ${styles.nowrap}`}>{booking.duration}</td>
      <td className={styles.cell}>
        <StatusBadge status={booking.status} />
      </td>
      <td className={`${styles.cell} ${styles.truncate}`}>{booking.notes || '—'}</td>
    </tr>
  );
}
