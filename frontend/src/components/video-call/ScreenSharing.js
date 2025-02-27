import { useState, useRef } from "react";
import { FaDesktop, FaStop } from "react-icons/fa";

const ScreenSharing = ({ onToggle }) => {
  const [isSharing, setIsSharing] = useState(false);
  const screenStreamRef = useRef(null);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      screenStreamRef.current = stream;
      setIsSharing(true);
      onToggle(stream);

      // Stop sharing when user clicks "Stop" button
      stream.getVideoTracks()[0].onended = () => stopScreenShare();
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setIsSharing(false);
    onToggle(null);
  };

  return (
    <button
      className="p-3 bg-gray-700 rounded-full hover:bg-yellow-500 transition"
      onClick={isSharing ? stopScreenShare : startScreenShare}
    >
      {isSharing ? <FaStop size={18} /> : <FaDesktop size={18} />}
    </button>
  );
};

export default ScreenSharing;