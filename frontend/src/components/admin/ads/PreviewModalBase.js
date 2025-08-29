import { FaChartBar } from 'react-icons/fa';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useEffect } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" role="dialog" aria-modal="true">
      <div className="bg-white max-w-md w-full rounded-lg shadow-lg p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-black" aria-label={t('close')}>
          ✕
        </button>
        {ad.video ? (
          <video src={ad.video} className="w-full h-48 object-cover rounded mb-4" controls />
        ) : (
          <img src={ad.image} alt={ad.title} className="w-full h-48 object-cover rounded mb-4" />
        )}
        <h2 className="text-xl font-bold mb-2">{ad.title}</h2>
        <p className="text-sm text-gray-700 mb-2">{ad.description}</p>
        <p className="text-xs text-gray-500 mb-1">🎯 {t('target_label')}: {(ad.targetRoles || []).join(', ')}</p>
        <p className="text-xs text-gray-500 mb-1">📅 {ad.startAt} → {ad.endAt}</p>
        {ad.views !== undefined && (
          <p className="text-xs text-blue-500">👁️ {t('views')}: {ad.views}</p>
        )}
        <p className="text-xs text-purple-500">📌 {tc('ad_type')}: {ad.adType}</p>
        {analyticsUrl && (
          <Link href={analyticsUrl}>
            <button className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-sm">
              <FaChartBar /> {t('view_analytics')}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default PreviewModalBase;

