import { useEffect } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useTranslation } from "next-i18next";
import modalStyles from "@/components/common/Modal.module.scss";

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

  const positionStyles = {
    center: { alignItems: "center", justifyContent: "center" },
    top: { alignItems: "flex-start", justifyContent: "center", paddingTop: "2.5rem" },
    bottom: { alignItems: "flex-end", justifyContent: "center", paddingBottom: "2.5rem" },
  };

  const themeStyles = {
    yellow: { background: "#fef9c3", borderColor: "#facc15", color: "#854d0e" },
    blue: { background: "#e0f2fe", borderColor: "#60a5fa", color: "#1d4ed8" },
    green: { background: "#dcfce7", borderColor: "#34d399", color: "#166534" },
    red: { background: "#fee2e2", borderColor: "#f87171", color: "#991b1b" },
  };

  const posStyle = positionStyles[data.position] || positionStyles.center;
  const themeStyle = themeStyles[data.theme] || themeStyles.yellow;

  return (
    <div className={modalStyles.simpleOverlay} role="dialog" aria-modal="true" style={posStyle}>
      <div
        className="relative max-w-sm w-full p-6 rounded shadow-lg"
        style={{
          ...themeStyle,
          background: themeStyle.background || "var(--bg-color)",
          color: themeStyle.color || "var(--text-color)",
          borderLeftWidth: "4px",
          borderLeftColor: themeStyle.borderColor,
        }}
      >
        <button
          onClick={onClose}
          className={modalStyles.closeButton}
          style={{ position: "absolute", top: "0.5rem", right: "0.5rem" }}
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
