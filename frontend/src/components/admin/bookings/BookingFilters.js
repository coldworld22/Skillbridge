import { FaSearch, FaFilter } from 'react-icons/fa';
import styles from "./BookingFilters.module.scss";

const defaultStatusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Declined', value: 'declined' },
];

const formatLabel = (option, counts) => {
  if (!counts) return option.label;
  const count = counts[option.value];
  if (typeof count !== 'number') return option.label;
  return `${option.label} (${count})`;
};

export default function BookingFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilter,
  statusCounts,
  options = defaultStatusOptions,
  className = '',
  searchPlaceholder = 'Search by student, instructor, or class',
  searchLabel = 'Search bookings',
  statusLabel = 'Filter by status',
}) {
  return (
    <div className={`${styles.wrapper} ${className || ""}`}>
      <label className={styles.field}>
        <span className="sr-only">{searchLabel}</span>
        <span className={styles.icon}>
          <FaSearch />
        </span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={styles.input}
        />
      </label>

      <label className={styles.field} style={{ width: "auto" }}>
        <span className="sr-only">{statusLabel}</span>
        <span className={styles.icon}>
          <FaFilter />
        </span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          aria-label={statusLabel}
          className={styles.select}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {formatLabel(option, statusCounts)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
