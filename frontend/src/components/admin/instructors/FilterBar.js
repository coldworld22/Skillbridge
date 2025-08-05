import { FaSearch, FaSortAlphaDown } from 'react-icons/fa';
import { useTranslation } from 'next-i18next';
import { useEffect, useState } from 'react';

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
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          placeholder={t('search_placeholder')}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-xs"
        />
      </div>

      <div className="flex items-center gap-2">
        <FaSortAlphaDown className="text-gray-400" />
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="name">{t('sort_name')}</option>
          <option value="date">{t('sort_date')}</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">{t('status_label')}:</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">{t('all')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
      </div>
    </div>
  );
}
