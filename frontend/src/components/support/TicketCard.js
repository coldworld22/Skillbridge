import StatusBadge from './StatusBadge';
import { FiClock, FiTag } from 'react-icons/fi';
import Image from 'next/image';
import useSupportTranslation from '@/hooks/useSupportTranslation';
import styles from './Ticket.module.scss';

export default function TicketCard({ ticket, onClick }) {
  const { t } = useSupportTranslation();
  const bgColors = {
    open: 'bg-blue-50',
    pending: 'bg-yellow-50',
    resolved: 'bg-green-50',
    closed: 'bg-gray-50',
  };

  const normalizedStatus = ticket.status?.toLowerCase();
  const priorityLabel = ticket.priority
    ? t(ticket.priority.toLowerCase(), { defaultValue: ticket.priority })
    : '';
  const displayUser =
    ticket.user_name ||
    ticket.user ||
    t('unknown_user', { defaultValue: 'Unknown user' });

  return (
    <div
      onClick={onClick}
      className={`${styles.card}`}
      style={{
        background:
          normalizedStatus && bgColors[normalizedStatus]
            ? `var(--bg-color, #fff)`
            : undefined,
      }}
    >
      {/* Header: Subject & Status */}
      <div className={styles.cardHeader}>
        <h3 className={styles.cardTitle}>{ticket.subject}</h3>
        <StatusBadge status={ticket.status} />
      </div>

      <div className={styles.ticketNumber}>#{ticket.ticket_number}</div>

      {/* Metadata: Priority, User, Date */}
      <div className={styles.metaRow}>
        <span className={styles.metaItem}>
          <FiTag className={styles.metaIcon} />
          {priorityLabel || ticket.priority}
        </span>
        <span className={styles.metaItem}>
          <Image
            src={ticket.user_avatar || '/images/default-avatar.png'}
            alt={
              ticket.user_name
                ? `${ticket.user_name}'s avatar`
                : ticket.user
                ? `${ticket.user}'s avatar`
                : 'User avatar'
            }
            width={16}
            height={16}
            className={styles.messageAvatar}
          />
          {displayUser}
        </span>
        <span className={styles.metaItem}>
          <FiClock className={styles.metaIcon} />
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Optional message preview */}
      {ticket.message && (
        <p className={styles.snippet}>
          {ticket.message}
        </p>
      )}
    </div>
  );
}
