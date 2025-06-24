// ParticipantList.js
import { useState } from "react";
import { FaMicrophoneSlash, FaUserShield, FaTimes } from "react-icons/fa";

const participantsMock = [
  { id: 1, name: "Ayman", role: "host", isMuted: false },
  { id: 2, name: "Sara", role: "participant", isMuted: false },
  { id: 3, name: "Omar", role: "participant", isMuted: true },
];

export default function ParticipantList({ chatId, userRole = "participant" }) {
  const [participants, setParticipants] = useState(participantsMock);

  const handleMute = (id) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isMuted: !p.isMuted } : p
      )
    );
    // TODO: Emit socket event or API call
  };

  const handleRemove = (id) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    // TODO: Emit socket event or API call
  };

  const handleMakeCoHost = (id) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, role: "co-host" } : p
      )
    );
    // TODO: Emit socket event or API call
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-yellow-400">👥 Participants</h3>
      {participants.map((user) => (
        <div
          key={user.id}
          className="flex justify-between items-center bg-gray-700 p-3 rounded-lg"
        >
          <div>
            <div className="font-medium flex items-center gap-1">
              {user.name}
              {user.isMuted && (
                <FaMicrophoneSlash className="text-red-500" />
              )}
            </div>
            <div className="text-sm text-gray-300">{user.role}</div>
          </div>
          {userRole === "host" && user.role !== "host" && (
            <div className="flex gap-2">
              <button
                className="p-2 bg-yellow-500 rounded hover:bg-yellow-600"
                onClick={() => handleMute(user.id)}
              >
                <FaMicrophoneSlash />
              </button>
              <button
                className="p-2 bg-blue-500 rounded hover:bg-blue-600"
                onClick={() => handleMakeCoHost(user.id)}
              >
                <FaUserShield />
              </button>
              <button
                className="p-2 bg-red-500 rounded hover:bg-red-600"
                onClick={() => handleRemove(user.id)}
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
