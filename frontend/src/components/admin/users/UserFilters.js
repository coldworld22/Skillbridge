export default function UserFilters({
    onSearch,
    onRoleFilter,
    onStatusFilter,
    onSortChange,
    onBulkDelete,
    selectedCount,
  }) {
    return (
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <input
            type="text"
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 p-2 border border-gray-300 rounded-md"
          />
          <select onChange={(e) => onRoleFilter(e.target.value)} className="p-2 border rounded-md">
            <option value="">All Roles</option>
            <option>Super Admin</option>
            <option>Admin</option>
            <option>Instructor</option>
            <option>Student</option>
          </select>
          <select onChange={(e) => onStatusFilter(e.target.value)} className="p-2 border rounded-md">
            <option value="">All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
  
        {/* Sorting + Bulk Delete */}
        <div className="flex gap-3 items-center justify-end">
          <select onChange={(e) => onSortChange(e.target.value)} className="p-2 border rounded-md">
            <option value="">Sort</option>
            <option value="name-asc">Name A → Z</option>
            <option value="name-desc">Name Z → A</option>
            <option value="created-desc">Newest First</option>
            <option value="created-asc">Oldest First</option>
          </select>
  
          {selectedCount > 0 && (
            <button
              onClick={onBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
            >
              Delete Selected ({selectedCount})
            </button>
          )}
        </div>
      </div>
    );
  }
  