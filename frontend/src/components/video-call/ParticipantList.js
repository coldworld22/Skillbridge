// ParticipantList.js
import { useState, useEffect } from "react";
import { FaMicrophoneSlash, FaUserShield, FaTimes } from "react-icons/fa";
import {
  fetchParticipants,
  muteParticipant,
  removeParticipant,
  makeCoHost,
} from "@/services/videoCallService";
import socket from "@/services/socketService";

export default function ParticipantList({ chatId, userRole = "participant" }) {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    fetchParticipants(chatId).then((data) => setParticipants(data));

    const handleParticipantUpdated = (participant) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participant.id ? { ...p, ...participant } : p
        )
      );
    };

    const handleParticipantRemoved = ({ id }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    };

    const handleUserJoined = (participant) => {
      setParticipants((prev) => [...prev, participant]);
    };

    socket.on("participant-updated", handleParticipantUpdated);
    socket.on("participant-removed", handleParticipantRemoved);
    socket.on("user-joined", handleUserJoined);

    return () => {
      socket.off("participant-updated", handleParticipantUpdated);
      socket.off("participant-removed", handleParticipantRemoved);
      socket.off("user-joined", handleUserJoined);
    };
  }, [chatId]);

  const handleMute = async (id, isMuted) => {
    try {
      const updated = await muteParticipant(chatId, id, !isMuted);
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error("Failed to mute participant", err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeParticipant(chatId, id);
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to remove participant", err);
    }
  };

  const handleMakeCoHost = async (id) => {
    try {
      const updated = await makeCoHost(chatId, id);
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error("Failed to update participant role", err);
    }
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
                onClick={() => handleMute(user.id, user.isMuted)}
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
