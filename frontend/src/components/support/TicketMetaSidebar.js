import PrioritySelector from './PrioritySelector';
import StatusBadge from './StatusBadge';
import { useTranslation } from 'next-i18next';

export default function TicketMetaSidebar({ ticket, onStatusChange, onPriorityChange }) {
  const { t } = useTranslation('dashboard');
  if (!ticket) return null;
  const isClosed = ticket.status === 'resolved';
  return (
    <div className="border-l p-4 w-60 bg-white rounded-r-lg space-y-4">
      <div>
        <div className="text-sm font-medium text-gray-500">{t('status')}</div>
        <StatusBadge status={ticket.status} />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-500 mb-1">{t('priority')}</div>
        <PrioritySelector value={ticket.priority} onChange={onPriorityChange} />
      </div>
      <button
        className={`w-full px-3 py-2 rounded text-white ${isClosed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}
        onClick={() => onStatusChange(isClosed ? 'open' : 'resolved')}
      >
        {isClosed ? t('reopen_ticket') : t('close_ticket')}
      </button>
    </div>
  );
}
