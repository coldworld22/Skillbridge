import { useState } from 'react';
import { useTranslation } from 'next-i18next';

export default function TicketReplyBox({ onSend, loading = false, disabled = false }) {
  const { t } = useTranslation('dashboard');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    await onSend(message.trim(), attachment);
    setMessage('');
    setAttachment(null);
    if (e.target?.reset) e.target.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <label htmlFor="reply" className="block text-sm font-medium text-gray-700">
        {t('your_reply')}
      </label>
      <textarea
        id="reply"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('type_response_here')}
        disabled={loading || disabled}
        className="w-full min-h-[120px] border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-gray-100"
      />

      <input
        type="file"
        onChange={(e) => setAttachment(e.target.files[0] || null)}
        disabled={loading || disabled}
        className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
      />

      <button
        type="submit"
        disabled={loading || disabled || !message.trim()}
        className="inline-flex items-center px-5 py-2 rounded-md text-sm font-semibold bg-yellow-500 hover:bg-yellow-600 text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Sending...' : t('send_reply')}
      </button>
    </form>
  );
}
