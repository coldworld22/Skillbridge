export default function StatusBadge({ status = '' }) {
  const colors = {
    open: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
  };

  const normalized = status.toLowerCase();

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${colors[normalized] || ''}`}>
      {status}
    </span>
  );
}
