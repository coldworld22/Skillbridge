import { useState } from 'react';
import useSupportTranslation from '@/hooks/useSupportTranslation';
import styles from './Ticket.module.scss';

export default function TicketReplyBox({ onSend, loading = false, disabled = false }) {
  const { t } = useSupportTranslation();
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
    <form onSubmit={handleSubmit} className={styles.replyForm}>
      <label htmlFor="reply" className={styles.label}>
        {t('your_reply')}
      </label>
      <textarea
        id="reply"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t('type_response_here')}
        disabled={loading || disabled}
        className={styles.textarea}
      />

      <input
        type="file"
        onChange={(e) => setAttachment(e.target.files[0] || null)}
        disabled={loading || disabled}
        className={styles.fileInput}
      />

      <button
        type="submit"
        disabled={loading || disabled || !message.trim()}
        className={styles.submit}
      >
        {loading ? t('processing') : t('send_reply')}
      </button>
    </form>
  );
}
