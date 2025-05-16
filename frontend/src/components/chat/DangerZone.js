export default function DangerZone({ onDelete, onTransfer }) {
    return (
      <div className="space-y-4 mt-8 border-t pt-6">
        <h3 className="text-lg font-bold text-red-600">☠️ Danger Zone</h3>
  
        <div className="p-4 border rounded bg-red-50">
          <p className="mb-2 text-sm text-gray-700">
            Deleting the group is permanent and cannot be undone.
          </p>
          <button
            onClick={onDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Delete Group
          </button>
        </div>
  
        <div className="p-4 border rounded bg-yellow-50">
          <p className="mb-2 text-sm text-gray-700">
            You can transfer group ownership to another admin.
          </p>
          <button
            onClick={onTransfer}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Transfer Ownership
          </button>
        </div>
      </div>
    );
  }
  