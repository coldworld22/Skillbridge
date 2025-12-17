import StatusBadge from './StatusBadge';
import Image from 'next/image';
import useSupportTranslation from '@/hooks/useSupportTranslation';
import styles from './Ticket.module.scss';

const isImage = (url) =>
  url ? /\.(png|jpe?g|gif|webp|svg)$/i.test(url) : false;

export default function TicketDetailPanel({ ticket }) {
  const { t } = useSupportTranslation();
  if (!ticket) return <div className={styles.panel}>{t('select_ticket_prompt')}</div>;
  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Image
          src={ticket.user_avatar || '/images/default-avatar.png'}
          alt={
            ticket.user_name
              ? `${ticket.user_name}'s avatar`
              : ticket.user
              ? `${ticket.user}'s avatar`
              : 'User avatar'
          }
          width={32}
          height={32}
          className={styles.avatar}
        />
        <div>
          <h2 className={styles.title}>{ticket.subject}</h2>
          <p className={styles.muted}>
            {ticket.user_name || ticket.user || t('unknown_user', { defaultValue: 'Unknown user' })}
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      <p className={styles.muted}>{ticket.description}</p>
      <div className={styles.messageList}>
        {ticket.messages?.map((m) => (
          <div key={m.id} className={styles.messageCard}>
            <Image
              src={m.sender_avatar || '/images/default-avatar.png'}
              alt={m.sender_name ? `${m.sender_name}'s avatar` : 'User avatar'}
              width={24}
              height={24}
              className={styles.messageAvatar}
            />
            <div>
              <div className={styles.mutedSmall} style={{ fontWeight: 700 }}>
                {m.sender_name || t('unknown_user', { defaultValue: 'User' })}
              </div>
              <p className={styles.muted}>{m.message}</p>
              {m.attachments?.length > 0 && (
                <div className={styles.messageList} style={{ marginTop: "0.35rem" }}>
                  {m.attachments.map((a) => (
                    isImage(a.file_url) ? (
                      <Image
                        key={a.id}
                        src={a.file_url}
                        alt={a.file_name || 'Image attachment'}
                        width={160}
                        height={160}
                        className={styles.attachmentImage}
                      />
                    ) : (
                      <a
                        key={a.id}
                        href={a.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.attachmentLink}
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
