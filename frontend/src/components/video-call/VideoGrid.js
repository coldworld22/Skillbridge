import { useState, useEffect } from "react";
import { FaMicrophoneSlash, FaVideoSlash, FaUserShield, FaChalkboardTeacher, FaWifi } from "react-icons/fa";

/** Dummy participants - Replace with real data from props or context */
const participants = [
  { id: 1, name: "Ayman", isMuted: false, isVideoOff: false, role: "host", isActive: true, connection: "good" },
  { id: 2, name: "Sara", isMuted: true, isVideoOff: true, role: "participant", isActive: false, connection: "fair" },
  { id: 3, name: "Omar", isMuted: false, isVideoOff: false, role: "co-host", isActive: false, connection: "good" },
  { id: 4, name: "Lina", isMuted: true, isVideoOff: false, role: "participant", isActive: false, connection: "poor" },
];

const VideoGrid = ({ chatId }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 w-full h-full">
      {participants.map((user) => (
        <VideoTile key={user.id} user={user} />
      ))}
    </div>
  );
};

const VideoTile = ({ user }) => {
  const getConnectionColor = (quality) => {
    if (quality === "good") return "text-green-400";
    if (quality === "fair") return "text-yellow-400";
    return "text-red-500";
  };

  return (
    <div
      className={`relative aspect-video bg-black rounded-lg shadow-lg overflow-hidden flex items-center justify-center border-4 ${
        user.isActive ? "border-yellow-500" : "border-transparent"
      }`}
    >
      {user.isVideoOff ? (
        <div className="flex flex-col items-center justify-center text-gray-400">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-xl font-bold mb-2">
            {user.name.charAt(0)}
          </div>
          <span>{user.name}'s camera is off</span>
        </div>
      ) : (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/demo-video.mp4" type="video/mp4" />
        </video>
      )}

      <div className="absolute bottom-0 left-0 w-full bg-black bg-opacity-60 px-2 py-1 text-white text-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span>{user.name}</span>
          {user.role === "host" && <FaChalkboardTeacher className="text-yellow-400" title="Host" />}
          {user.role === "co-host" && <FaUserShield className="text-blue-400" title="Co-host" />}
        </div>
        <div className="flex items-center gap-2">
          {user.isMuted && <FaMicrophoneSlash className="text-red-500" />}
          {user.isVideoOff && <FaVideoSlash className="text-yellow-400" />}
          <FaWifi className={`${getConnectionColor(user.connection)}`} title={`Connection: ${user.connection}`} />
        </div>
      </div>
    </div>
  );
};

export default VideoGrid;
