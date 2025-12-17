import { useMemo, useState } from "react";
import useBreakoutRoomManager from "@/components/video-call/BreakoutRoomManager";

export default function BreakoutRoomControl({
  classId,
  userId,
  userName = "Instructor",
  userRole = "host",
  manager,
  participants: participantsProp = [],
}) {
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const fallbackManager = useBreakoutRoomManager(
    manager
      ? {}
      : {
          roomId: classId,
          userId,
          userName,
          userRole,
        },
  );
  const {
    rooms,
    createRoom,
    assignToRoom,
    joinRoom,
    leaveRoom,
    currentRoom,
    inRoom,
    participants: liveParticipants = [],
  } = manager || fallbackManager;

  const participants = useMemo(() => {
    const source = manager?.participants || participantsProp || liveParticipants || [];
    const filtered = Array.isArray(source) ? source : [];
    return filtered.filter((p) => p && (p.userId || p.id));
  }, [liveParticipants, manager, participantsProp]);

  const handleAssign = () => {
    if (!selectedParticipant || !selectedRoom) return;
    assignToRoom(selectedParticipant, selectedRoom);
    setSelectedParticipant("");
  };

  return (
    <div className="text-sm text-white space-y-4">
      {/* Room Creator */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Create new room..."
          onKeyDown={(e) => {
            if (e.key === "Enter") createRoom(e.target.value);
          }}
          className="w-full px-3 py-2 rounded bg-gray-700 text-white"
        />
      </div>

      {/* Assign Participants */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={selectedParticipant}
          onChange={(e) => setSelectedParticipant(e.target.value)}
          className="flex-1 px-3 py-2 rounded bg-gray-700 text-white"
        >
          <option value="">Select participant</option>
          {participants.map((participant) => (
            <option key={participant.userId || participant.id} value={participant.userId || participant.id}>
              {participant.name || participant.userId || "Participant"}
            </option>
          ))}
        </select>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="bg-gray-700 text-white px-2 py-1 rounded"
        >
          <option value="">Select Room</option>
          {rooms.map((room) => (
            <option key={room.name} value={room.name}>{room.name}</option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          className={`px-3 py-2 rounded font-semibold ${
            selectedParticipant && selectedRoom
              ? "bg-yellow-500 text-black"
              : "bg-gray-600 text-gray-300 cursor-not-allowed"
          }`}
          disabled={!selectedParticipant || !selectedRoom}
        >
          Assign
        </button>
      </div>
      {participants.length === 0 && (
        <p className="text-xs text-gray-400">No live participants available yet.</p>
      )}

      {/* Join Any Room */}
      <div>
        <h3 className="text-yellow-400 font-semibold mb-2">Join a Room</h3>
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.name}
              onClick={() => joinRoom(room.name)}
              className={`w-full py-2 px-3 rounded ${
                currentRoom === room.name
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-white hover:bg-yellow-500 hover:text-black"
              }`}
            >
              {room.name}
            </button>
          ))}
          {inRoom && (
            <button
              onClick={leaveRoom}
              className="w-full py-2 px-3 bg-red-500 text-white rounded"
            >
              Leave Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
