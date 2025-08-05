import { useTranslation } from 'next-i18next';

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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <input
          id="selectAll"
          type="checkbox"
          checked={allSelected}
          onChange={handleToggleAll}
        />
        <label htmlFor="selectAll" className="text-sm text-gray-700">
          {allSelected ? t('deselect_all') : t('select_all')} ({allVisibleIds.length})
        </label>
      </div>

      {selectedIds.length > 0 && (
        <button
          onClick={onDeleteSelected}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
        >
          {t('delete_selected')} ({selectedIds.length})
        </button>
      )}
    </div>
  );
}
