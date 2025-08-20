import { useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useTranslation } from "next-i18next";

export default function PopupPreviewModal({ data, onClose }) {
  const { t } = useTranslation('dashboard', { keyPrefix: 'popupAnnouncementsPage' });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!data) return null;

  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-10',
    bottom: 'items-end justify-center pb-10',
  };

  const themeClasses = {
    yellow: 'bg-yellow-100 border-yellow-400 text-yellow-800',
    blue: 'bg-blue-100 border-blue-400 text-blue-800',
    green: 'bg-green-100 border-green-400 text-green-800',
    red: 'bg-red-100 border-red-400 text-red-800',
  };

  const posClass = positionClasses[data.position] || positionClasses.center;
  const themeClass = themeClasses[data.theme] || themeClasses.yellow;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex ${posClass} z-50`} role="dialog" aria-modal="true">
      <div className={`relative max-w-sm w-full border-l-4 ${themeClass} p-6 rounded shadow-lg`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          aria-label={t('close', { defaultValue: 'Close' })}
        >
          ✕
        </button>
        <h2 className="text-lg font-bold mb-2">{data.title}</h2>
        <div className="prose text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.message) }} />
      </div>
    </div>
  );
}
