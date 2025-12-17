import { useTranslation } from 'next-i18next';
import styles from './Instructors.module.scss';

export default function BulkActions({ selectedIds, onSelectAll, onDeleteSelected, allVisibleIds }) {
  const { t } = useTranslation('dashboard', { keyPrefix: 'instructorsPage' });
  const allSelected = selectedIds.length === allVisibleIds.length;

  const handleToggleAll = () => {
    if (allSelected) {
      onSelectAll([]);
    } else {
      onSelectAll(allVisibleIds);
    }
  };

  return (
    <div className={styles.bulkBar}>
      <div className={styles.checkboxRow}>
        <input
          id="selectAll"
          type="checkbox"
          checked={allSelected}
          onChange={handleToggleAll}
        />
        <label htmlFor="selectAll" className={styles.filterLabel}>
          {allSelected ? t('deselect_all') : t('select_all')} ({allVisibleIds.length})
        </label>
      </div>

      {selectedIds.length > 0 && (
        <button
          onClick={() => {
            if (confirm(t('confirm_bulk_delete'))) {
              onDeleteSelected();
            }
          }}
          className={styles.bulkDanger}
        >
          {t('delete_selected')} ({selectedIds.length})
        </button>
      )}
    </div>
  );
}
