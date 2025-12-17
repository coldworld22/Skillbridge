import { useEffect, useRef } from "react";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";
import styles from "./AdMediaModal.module.scss";

export default function AdMediaModal({ ad, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  if (!ad) return null;

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleBackdrop}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.container}>
        <button
          ref={closeRef}
          onClick={onClose}
          className={styles.close}
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>
        {ad.video ? (
          <video
            src={ad.video}
            className={styles.media}
            controls
            autoPlay
          >
            {ad.captions && (
              <track kind="captions" src={ad.captions} label="captions" />
            )}
          </video>
        ) : (
          <Image
            src={ad.image}
            alt={ad.title}
            width={800}
            height={600}
            className={styles.media}
          />
        )}
      </div>
    </div>
  );
}
