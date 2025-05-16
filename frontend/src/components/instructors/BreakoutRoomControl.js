import { useState } from "react";
import useBreakoutRoomManager from "@/components/video-call/BreakoutRoomManager";

export default function BreakoutRoomControl({ classId, userName = "Instructor", userRole = "host" }) {
  const [participantInput, setParticipantInput] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  const {
    rooms,
    createRoom,
    assignToRoom,
    joinRoom,
    leaveRoom,
    currentRoom,
    inRoom,
  } = useBreakoutRoomManager(userName, userRole);

  const handleAssign = () => {
    if (!participantInput || !selectedRoom) return;
    assignToRoom(participantInput, selectedRoom);
    setParticipantInput("");
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
      <div className="flex gap-2">
        <input
          type="text"
          value={participantInput}
          onChange={(e) => setParticipantInput(e.target.value)}
          placeholder="Student name"
          className="flex-1 px-3 py-2 rounded bg-gray-700 text-white"
        />
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
          className="bg-yellow-500 text-black px-3 py-2 rounded font-semibold"
        >
          Assign
        </button>
      </div>

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
