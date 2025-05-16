export default function BulkActions({ selectedIds, onSelectAll, onDeleteSelected, allVisibleIds }) {
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
          type="checkbox"
          checked={allSelected}
          onChange={handleToggleAll}
        />
        <span className="text-sm text-gray-700">
          {allSelected ? 'Deselect All' : 'Select All'} ({allVisibleIds.length})
        </span>
      </div>

      {selectedIds.length > 0 && (
        <button
          onClick={onDeleteSelected}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
        >
          Delete Selected ({selectedIds.length})
        </button>
      )}
    </div>
  );
}
