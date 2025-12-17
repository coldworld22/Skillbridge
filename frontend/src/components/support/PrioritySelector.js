import useSupportTranslation from '@/hooks/useSupportTranslation';
import styles from './Ticket.module.scss';

export default function PrioritySelector({ value, onChange }) {
  const { t } = useSupportTranslation();
  const options = [
    { value: 'low', label: t('low') },
    { value: 'medium', label: t('medium') },
    { value: 'high', label: t('high') },
    { value: 'urgent', label: t('urgent') },
  ];

  return (
    <select
      className={styles.prioritySelect}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
