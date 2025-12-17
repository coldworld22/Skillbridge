import PrioritySelector from './PrioritySelector';
import StatusBadge from './StatusBadge';
import useSupportTranslation from '@/hooks/useSupportTranslation';
import styles from './Ticket.module.scss';

export default function TicketMetaSidebar({ ticket, onStatusChange, onPriorityChange }) {
  const { t } = useSupportTranslation();
  if (!ticket) return null;
  const isClosed = ticket.status === 'resolved';
  return (
    <div className={styles.sidebar}>
      <div>
        <div className={styles.label}>{t('status')}</div>
        <StatusBadge status={ticket.status} />
      </div>
      <div>
        <div className={styles.label}>{t('priority')}</div>
        <PrioritySelector value={ticket.priority} onChange={onPriorityChange} />
      </div>
      <button
        className={`${styles.actionButton} ${isClosed ? styles.actionPrimary : styles.actionDanger}`}
        onClick={() => onStatusChange(isClosed ? 'open' : 'resolved')}
      >
        {isClosed ? t('reopen_ticket') : t('close_ticket')}
      </button>
    </div>
  );
}
