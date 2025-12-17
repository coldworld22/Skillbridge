import { useState } from 'react';
import styles from './Ticket.module.scss';

export default function TagEditor({ tags = [], onAdd }) {
  const [value, setValue] = useState('');
  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue('');
    }
  };
  return (
    <div className={styles.tagEditor}>
      <div className={styles.tagRow}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={styles.tagInput}
          placeholder="Add tag"
        />
        <button onClick={handleAdd} className={styles.tagButton}>
          Add
        </button>
      </div>
      <div className={styles.tagList}>
        {tags.map((t) => (
          <span key={t} className={styles.tagChip}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
