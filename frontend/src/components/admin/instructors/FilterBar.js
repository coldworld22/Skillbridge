import { FaSearch, FaSortAlphaDown } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';
import styles from './Instructors.module.scss';

export default function FilterBar({ search, onSearchChange, sort, onSortChange, statusFilter, onStatusFilter }) {
  const { t } = useTranslation('dashboard', { keyPrefix: 'instructorsPage' });

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <FaSearch className={styles.muted} aria-hidden="true" />
        <label htmlFor="search" className="sr-only">
          {t('search_label')}
        </label>
        <input
          id="search"
          type="text"
          placeholder={t('search_placeholder')}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className={styles.input}
        />
      </div>

      <div className={styles.filterGroup}>
        <FaSortAlphaDown className={styles.muted} aria-hidden="true" />
        <label htmlFor="sort" className="sr-only">
          {t('sort_label')}
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className={styles.select}
        >
          <option value="name">{t('sort_name')}</option>
          <option value="date">{t('sort_date')}</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>{t('status_label')}:</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className={styles.select}
        >
          <option value="all">{t('all')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
      </div>
    </div>
  );
}
