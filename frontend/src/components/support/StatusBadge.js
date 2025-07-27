export default function StatusBadge({ status }) {
  const colors = {
    Open: 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-800',
    Resolved: 'bg-green-100 text-green-700',
    Closed: 'bg-gray-200 text-gray-700',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status] || ''}`}>{status}</span>
  );
}
