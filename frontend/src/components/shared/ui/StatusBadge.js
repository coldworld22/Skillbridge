const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  approved: 'bg-blue-100 text-blue-700 border border-blue-200',
  completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-700 border border-rose-200',
  declined: 'bg-rose-100 text-rose-700 border border-rose-200',
  rescheduled: 'bg-indigo-100 text-indigo-700 border border-indigo-200',
};

const SIZE_MAP = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
};

const formatStatus = (value) => {
  if (!value) return '';
  const normalized = value.toString().trim();
  if (!normalized) return '';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function StatusBadge({
  status,
  label,
  size = 'sm',
  className = '',
}) {
  const normalized = status?.toString().toLowerCase();
  const baseClasses =
    STATUS_STYLES[normalized] ?? 'bg-gray-100 text-gray-600 border border-gray-200';
  const sizeClasses = SIZE_MAP[size] ?? SIZE_MAP.sm;
  const content = label ?? formatStatus(status);

  if (!content) {
    return null;
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${sizeClasses} ${baseClasses} ${className}`}
    >
      {content}
    </span>
  );
}
