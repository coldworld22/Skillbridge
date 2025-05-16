import { FaSearch, FaFilter } from 'react-icons/fa';

export default function BookingFilters({ search, onSearchChange, statusFilter, onStatusFilter }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by student, instructor, or class"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-md"
        />
      </div>

      <div className="flex items-center gap-2">
        <FaFilter className="text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  );
}
