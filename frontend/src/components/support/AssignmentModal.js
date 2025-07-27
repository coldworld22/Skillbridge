export default function AssignmentModal({ open, onAssign, onClose }) {
  const handleAssign = () => {
    const id = prompt('Enter admin ID to assign');
    if (id) onAssign(Number(id));
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Assign Ticket</h3>
        <div className="flex gap-2">
          <button onClick={handleAssign} className="bg-blue-600 text-white px-3 py-1 rounded">Assign</button>
          <button onClick={onClose} className="border px-3 py-1 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
}
