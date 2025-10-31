import { FaSearch, FaFilter } from 'react-icons/fa';

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
    <div
      className={`flex flex-col gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <label className="flex w-full items-center gap-3 sm:max-w-md">
        <span className="sr-only">{searchLabel}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <FaSearch />
        </span>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>

      <label className="flex w-full items-center gap-3 sm:w-auto">
        <span className="sr-only">{statusLabel}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <FaFilter />
        </span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          aria-label={statusLabel}
          className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-48"
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
