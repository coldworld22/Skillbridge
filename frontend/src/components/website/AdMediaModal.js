import { FaTimes } from "react-icons/fa";

export default function AdMediaModal({ ad, onClose }) {
  if (!ad) return null;
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={handleBackdrop}
    >
      <div className="relative w-full max-w-3xl mx-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white hover:text-yellow-400"
          aria-label="Close"
        >
          <FaTimes size={20} />
        </button>
        {ad.video ? (
          <video src={ad.video} className="w-full max-h-screen" controls autoPlay />
        ) : (
          <img
            src={ad.image}
            alt={ad.title}
            className="w-full max-h-screen object-contain"
          />
        )}
      </div>
    </div>
  );
}
