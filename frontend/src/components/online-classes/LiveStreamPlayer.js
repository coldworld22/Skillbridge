import { useState } from "react";

const LiveStreamPlayer = ({ liveClassId }) => {
  const [isLive, setIsLive] = useState(false);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-6">
      <h3 className="text-lg font-semibold text-yellow-400">🎥 Live Streaming</h3>
      {!isLive ? (
        <div className="bg-gray-700 p-6 rounded-lg text-center">
          <p className="text-white">Waiting for instructor to start the live stream...</p>
        </div>
      ) : (
        <div className="w-full h-64 bg-black rounded-lg flex items-center justify-center text-white">
          🔴 Live Stream Here
        </div>
      )}
      <button
        onClick={() => setIsLive(!isLive)}
        className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition w-full"
      >
        {isLive ? "End Stream" : "Start Stream"}
      </button>
    </div>
  );
};

export default LiveStreamPlayer;
