import { useState, useEffect } from "react";

const ParticipantsList = ({ liveClassId }) => {
  const [participants, setParticipants] = useState([]);

  // Dummy Data (Replace with API call)
  useEffect(() => {
    setParticipants([
      { id: 1, name: "Alice", avatar: "/images/avatars/alice.jpg" },
      { id: 2, name: "Bob", avatar: "/images/avatars/bob.jpg" },
      { id: 3, name: "Charlie", avatar: "/images/avatars/charlie.jpg" },
    ]);
  }, [liveClassId]);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-yellow-400">👥 Participants</h3>
      {participants.length === 0 ? (
        <p className="text-gray-300 mt-2">No participants yet.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {participants.map((participant) => (
            <li key={participant.id} className="flex items-center gap-3 bg-gray-700 p-2 rounded-lg">
              <img src={participant.avatar} alt={participant.name} className="w-8 h-8 rounded-full border border-yellow-500" />
              <span className="text-white">{participant.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ParticipantsList;
