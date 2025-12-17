import { FaChartBar } from 'react-icons/fa';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import modalStyles from '@/components/common/Modal.module.scss';
import styles from './PreviewModalBase.module.scss';

const PreviewModalBase = ({ ad, onClose, analyticsUrl }) => {
  const { t } = useTranslation('dashboard', { keyPrefix: 'adsPage' });
  const { t: tc } = useTranslation('dashboard', { keyPrefix: 'adsCreatePage' });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!ad) return null;

  return (
    <div className={modalStyles.simpleOverlay} role="dialog" aria-modal="true">
      <div className={modalStyles.panel} style={{ maxWidth: '28rem', position: 'relative' }}>
        <button onClick={onClose} className={modalStyles.closeButton} aria-label={t('close')} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
          ✕
        </button>
        {ad.video ? (
          <video src={ad.video} className={styles.media} controls />
        ) : (
          <img src={ad.image} alt={ad.title} className={styles.media} />
        )}
        <h2 className={styles.title}>{ad.title}</h2>
        <p className={styles.description}>{ad.description}</p>
        <p className={styles.meta}>🎯 {t('target_label')}: {(ad.targetRoles || []).join(', ')}</p>
        <p className={styles.meta}>📅 {ad.startAt} → {ad.endAt}</p>
        {ad.views !== undefined && (
          <p className={styles.meta}>👁️ {t('views')}: {ad.views}</p>
        )}
        <p className={styles.meta}>📌 {tc('ad_type')}: {ad.adType}</p>
        {analyticsUrl && (
          <div className={modalStyles.ctaRow} style={{ justifyContent: 'center' }}>
            <Link href={analyticsUrl}>
              <Button variant="accent" style={{ width: '100%' }}>
                <FaChartBar /> {t('view_analytics')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModalBase;
