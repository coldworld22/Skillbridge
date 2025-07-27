import PrioritySelector from './PrioritySelector';
import StatusBadge from './StatusBadge';

export default function TicketMetaSidebar({ ticket, onStatusChange, onPriorityChange }) {
  if (!ticket) return null;
  return (
    <div className="border-l p-4 w-60 bg-white rounded-r-lg">
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-500">Status</div>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-500 mb-1">Priority</div>
        <PrioritySelector value={ticket.priority} onChange={onPriorityChange} />
      </div>
    </div>
  );
}
