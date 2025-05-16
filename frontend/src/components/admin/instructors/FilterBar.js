import { FaSearch, FaSortAlphaDown } from 'react-icons/fa';

export default function FilterBar({ search, onSearchChange, sort, onSortChange, statusFilter, onStatusFilter }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="flex items-center gap-2">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Search instructors..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
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
          <option value="name">Sort by Name</option>
          <option value="date">Sort by Join Date</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}
