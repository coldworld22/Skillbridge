import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaMicrophoneSlash, FaDoorOpen, FaBullhorn, FaTimes, FaUsers } from "react-icons/fa";

const initialRooms = [
  { id: 1, name: "React Fundamentals", participants: ["Alice", "Bob"] },
  { id: 2, name: "Node.js Backend", participants: ["Charlie", "David"] },
  { id: 3, name: "AI & ML Discussion", participants: ["Eve", "Frank"] },
];

const HostDashboard = () => {
  const [rooms, setRooms] = useState(initialRooms);
  const [broadcastMessage, setBroadcastMessage] = useState("");

  // Move User to Another Room
  const moveUser = (user, fromRoomId, toRoomId) => {
    const updatedRooms = rooms.map((room) => {
      if (room.id === fromRoomId) {
        return { ...room, participants: room.participants.filter((p) => p !== user) };
      }
      if (room.id === toRoomId) {
        return { ...room, participants: [...room.participants, user] };
      }
      return room;
    });
    setRooms(updatedRooms);
  };

  // Mute a User
  const muteUser = (user) => {
    alert(`${user} has been muted.`);
  };

  // Remove a User
  const removeUser = (user, roomId) => {
    setRooms(
      rooms.map((room) =>
        room.id === roomId ? { ...room, participants: room.participants.filter((p) => p !== user) } : room
      )
    );
  };

  // End All Breakout Sessions
  const endSessions = () => {
    setRooms(initialRooms.map((room) => ({ ...room, participants: [] })));
    alert("Breakout sessions have ended. All users returned to the main session.");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-8">
      <motion.h1 
        className="text-3xl font-bold text-yellow-400 text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Host Dashboard: Manage Breakout Rooms
      </motion.h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <motion.div 
            key={room.id}
            className="bg-gray-800 p-4 rounded-lg shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-yellow-300 mb-3">{room.name}</h2>
            <ul className="space-y-2">
              {room.participants.length > 0 ? (
                room.participants.map((user) => (
                  <li key={user} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                    <span>{user}</span>
                    <div className="flex space-x-2">
                      <button onClick={() => muteUser(user)} className="text-red-400 hover:text-red-500">
                        <FaMicrophoneSlash />
                      </button>
                      <button
                        onClick={() => removeUser(user, room.id)}
                        className="text-yellow-400 hover:text-yellow-500"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-400">No participants</p>
              )}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Broadcast Message */}
      <div className="mt-6 flex flex-col items-center">
        <input
          type="text"
          placeholder="Send announcement to all rooms..."
          value={broadcastMessage}
          onChange={(e) => setBroadcastMessage(e.target.value)}
          className="w-full max-w-lg p-3 bg-gray-800 rounded-lg border border-gray-600 text-white"
        />
        <button
          onClick={() => alert(`Broadcasting: ${broadcastMessage}`)}
          className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FaBullhorn className="inline-block mr-2" /> Send Announcement
        </button>
      </div>

      {/* End Sessions */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={endSessions}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition shadow-lg"
        >
          <FaDoorOpen className="inline-block mr-2" /> End All Breakout Sessions
        </button>
      </div>
    </div>
  );
};

export default HostDashboard;
