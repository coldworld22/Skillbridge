import StatusBadge from './StatusBadge';
import Image from 'next/image';

const isImage = (url) =>
  url ? /\.(png|jpe?g|gif|webp|svg)$/i.test(url) : false;

export default function TicketDetailPanel({ ticket }) {
  if (!ticket) return <div className="p-4">Select a ticket</div>;
  return (
    <div className="p-4 bg-white rounded-lg shadow space-y-4">
      <div className="flex items-center gap-3">
        <Image
          src={ticket.user_avatar || '/images/default-avatar.png'}
          alt={
            ticket.customerName
              ? `${ticket.customerName}'s avatar`
              : ticket.user_name
              ? `${ticket.user_name}'s avatar`
              : ticket.user
              ? `${ticket.user}'s avatar`
              : 'User avatar'
          }
          width={32}
          height={32}
          className="w-8 h-8 rounded-full object-cover"
        />
        <div>
          <h2 className="text-xl font-semibold mb-1">{ticket.subject}</h2>
          <p className="text-sm text-gray-500">
            {ticket.customerName || ticket.user_name || ticket.user}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      <p className="whitespace-pre-line">{ticket.description}</p>
      <div className="space-y-3">
        {ticket.messages?.map((m) => (
          <div key={m.id} className="flex gap-3 items-start border p-2 rounded bg-gray-50">
            <Image
              src={m.sender_avatar || '/images/default-avatar.png'}
              alt={m.sender_name ? `${m.sender_name}'s avatar` : 'User avatar'}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-cover mt-1"
            />
            <div>
              <div className="text-xs font-semibold text-gray-700">{m.sender_name || 'User'}</div>
              <p className="text-sm text-gray-600 whitespace-pre-line">{m.message}</p>
              {m.attachments?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.attachments.map((a) => (
                    isImage(a.file_url) ? (
                      <Image
                        key={a.id}
                        src={a.file_url}
                        alt={a.file_name || 'Image attachment'}
                        width={160}
                        height={160}
                        className="max-h-40 rounded"
                      />
                    ) : (
                      <a
                        key={a.id}
                        href={a.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline text-sm block"
                      >
                        {a.file_name || a.file_url.split('/').pop()}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
