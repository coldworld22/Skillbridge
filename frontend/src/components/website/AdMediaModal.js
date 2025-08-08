import { useEffect, useRef } from "react";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";

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
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={handleBackdrop}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-3xl mx-4">
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-yellow-400"
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>
        {ad.video ? (
          <video
            src={ad.video}
            className="w-full max-h-screen"
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
            className="w-full max-h-screen object-contain"
          />
        )}
      </div>
    </div>
  );
}
