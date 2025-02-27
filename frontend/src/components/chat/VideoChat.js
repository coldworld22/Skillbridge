import { useState } from "react";
import { FaVideo, FaMicrophone, FaPhoneSlash } from "react-icons/fa";

const VideoChat = () => {
  const [isCallActive, setIsCallActive] = useState(false);

  const startCall = () => {
    setIsCallActive(true);
    console.log("Starting Video Call...");
  };

  const endCall = () => {
    setIsCallActive(false);
    console.log("Ending Video Call...");
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded-lg shadow-lg text-center">
      {isCallActive ? (
        <div>
          <h3 className="text-xl font-bold">🔴 Live Video Call</h3>
          <div className="flex justify-center space-x-4 mt-4">
            <button onClick={endCall} className="p-4 bg-red-500 rounded-full hover:bg-red-600">
              <FaPhoneSlash size={24} />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-bold">📹 Video Call</h3>
          <p className="text-gray-400">Start a video call with your group.</p>
          <button onClick={startCall} className="mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
            <FaVideo className="mr-2 inline" /> Start Call
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoChat;
