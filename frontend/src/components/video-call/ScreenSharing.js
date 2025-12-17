import { FaDesktop, FaStop } from "react-icons/fa";

const ScreenSharing = ({ isSharing, onStart, onStop, disabled = false }) => {
  const handleToggle = () => {
    if (isSharing) {
      onStop?.();
    } else if (!disabled) {
      onStart?.();
    }
  };

  return (
    <button
      className={`p-3 rounded-full transition ${disabled && !isSharing ? "bg-gray-600 opacity-60 cursor-not-allowed" : "bg-gray-700 hover:bg-yellow-500"}`}
      disabled={disabled && !isSharing}
      onClick={handleToggle}
      type="button"
      title={disabled && !isSharing ? "Enable screen access to start sharing" : undefined}
    >
      {isSharing ? <FaStop size={18} /> : <FaDesktop size={18} />}
    </button>
  );
};

export default ScreenSharing;
