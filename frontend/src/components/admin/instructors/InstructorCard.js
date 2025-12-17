import { FaToggleOn, FaToggleOff, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import styles from './Instructors.module.scss';

export default function InstructorCard({ instructor, onToggle, onDelete }) {
  const { t } = useTranslation('dashboard', { keyPrefix: 'instructorsPage' });
  return (
    <div className={styles.card}>
      <img
        src={instructor.avatar}
        alt={instructor.name}
        className={styles.avatar}
      />
      <h2 className={styles.name}>{instructor.name}</h2>
      <p className={styles.muted}>{instructor.email}</p>
      <p className={styles.mutedSmall}>{t('joined', { date: instructor.joinDate })}</p>

      <div className={styles.actions}>
        <button
          onClick={() => onToggle(instructor.id)}
          className={`${styles.action} ${styles.actionPrimary}`}
          aria-label={
            instructor.status
              ? t('deactivate_instructor', { name: instructor.name })
              : t('activate_instructor', { name: instructor.name })
          }
        >
          {instructor.status ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
        </button>
        <button
          onClick={() => onDelete(instructor.id)}
          className={`${styles.action} ${styles.actionDanger}`}
          aria-label={t('delete_instructor', { name: instructor.name })}
        >
          <FaTrash size={18} />
        </button>
      </div>
    </div>
  );
}
