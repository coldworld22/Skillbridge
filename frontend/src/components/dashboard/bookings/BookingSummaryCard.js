import StatusBadge from '@/components/shared/ui/StatusBadge';

const ACTION_VARIANTS = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
};

export default function BookingSummaryCard({
  avatar,
  title,
  subtitle,
  status,
  meta = [],
  note,
  actions = [],
  onClick,
  className = '',
}) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex gap-4">
        {avatar && (
          <img
            src={avatar}
            alt={title}
            className="h-14 w-14 flex-shrink-0 rounded-full border border-gray-200 object-cover"
          />
        )}

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-gray-900">{title}</p>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {status && <StatusBadge status={status} size="md" />}
          </div>

          {meta.length > 0 && (
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-gray-600 sm:grid-cols-2">
              {meta.map(({ label, value }) => (
                <div key={label} className="flex gap-2">
                  <dt className="w-20 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {label}
                  </dt>
                  <dd className="flex-1 font-medium text-gray-700">
                    {value || '—'}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {note && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {note}
            </p>
          )}

          {actions.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {actions.map(({ label, onClick: onActionClick, variant = 'secondary', icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition ${ACTION_VARIANTS[variant] ?? ACTION_VARIANTS.secondary}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (onActionClick) {
                      onActionClick();
                    }
                  }}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
