import { useEffect, useState } from 'react';
import groupService from '@/services/groupService';
import toast from 'react-hot-toast';
import { useTranslation } from 'next-i18next';

export default function JoinRequestCard({
  groupId,
  onCountChange,
  onActionComplete,
}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { t } = useTranslation('dashboard', { keyPrefix: 'groupRequests' });

  useEffect(() => {
    let active = true;
    const fetchRequests = async () => {
      try {
        const data = await groupService.getJoinRequestsForGroup(groupId);
        if (!active) return;
        setRequests(data);
        if (onCountChange) onCountChange(data.length);
      } catch (error) {
        if (!active) return;
        toast.error(t('loadFailed'));
        setRequests([]);
        if (onCountChange) onCountChange(0);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRequests();
    return () => {
      active = false;
    };
  }, [groupId, onCountChange]);

  const formatRequestedAt = (value) => {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleString();
  };

  const handleAction = async (id, action) => {
    try {
      setProcessingId(id);
      const payload =
        action === 'approve'
          ? await groupService.approveRequest(id)
          : await groupService.rejectRequest(id);

      if (action === 'approve') {
        toast.success(t('approved'));
      } else {
        toast.success(t('rejected'));
      }

      setRequests((prev) => {
        const next = prev.filter((r) => r.id !== id);
        if (onCountChange) onCountChange(next.length);
        return next;
      });

      onActionComplete?.({ id, action, payload });
    } catch (error) {
      toast.error(t('actionFailed'));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">{t('loading')}</p>;
  if (requests.length === 0) return <p className="text-sm text-gray-500">{t('empty')}</p>;

  return (
    <div className="bg-white p-4 rounded shadow space-y-3">
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
        >
          <div className="flex items-center gap-3">
            <img
              src={req.avatar || '/images/default-avatar.png'}
              alt={req.name}
              className="h-10 w-10 rounded-full border object-cover"
            />
            <div className="text-sm">
              <p className="font-medium text-gray-800">{req.name}</p>
              {req.role && (
                <p className="text-[11px] uppercase text-gray-400">
                  {req.role}
                </p>
              )}
              {req.email && (
                <p className="text-xs text-gray-500">{req.email}</p>
              )}
              <p className="text-[11px] text-gray-400">
                {formatRequestedAt(req.requestedAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(req.id, 'approve')}
              disabled={processingId === req.id}
              className={`text-sm font-medium ${
                processingId === req.id
                  ? 'text-green-300 cursor-not-allowed'
                  : 'text-green-600 hover:underline'
              }`}
            >
              {t('approve')}
            </button>
            <button
              onClick={() => handleAction(req.id, 'reject')}
              disabled={processingId === req.id}
              className={`text-sm font-medium ${
                processingId === req.id
                  ? 'text-red-300 cursor-not-allowed'
                  : 'text-red-600 hover:underline'
              }`}
            >
              {t('reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
