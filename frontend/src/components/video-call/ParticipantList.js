import React from "react";
import { FaMicrophone, FaVideo, FaPhoneSlash, FaCommentDots, FaDesktop, FaUserCircle } from "react-icons/fa";

const CallControls = ({ onChatToggle, onEndCall }) => {
  return (
    <div className="bg-gray-700 p-4 flex justify-center gap-6">
      <button className="p-3 bg-gray-600 rounded-full text-white hover:bg-gray-500">
        <FaMicrophone />
      </button>
      <button className="p-3 bg-gray-600 rounded-full text-white hover:bg-gray-500">
        <FaVideo />
      </button>
      <button className="p-3 bg-red-600 rounded-full text-white hover:bg-red-500" onClick={onEndCall}>
        <FaPhoneSlash />
      </button>
      <button className="p-3 bg-gray-600 rounded-full text-white hover:bg-gray-500" onClick={onChatToggle}>
        <FaCommentDots />
      </button>
      <button className="p-3 bg-gray-600 rounded-full text-white hover:bg-gray-500">
        <FaDesktop />
      </button>
    </div>
  );
};

const ParticipantList = ({ participants = [] }) => {
  return (
    <div className="bg-gray-800 p-4 w-1/4 min-h-full border-l border-gray-600">
      <h3 className="text-lg font-semibold text-white mb-4">Participants</h3>
      <ul className="space-y-3">
        {participants.length > 0 ? (
          participants.map((participant, index) => (
            <li key={index} className="flex items-center gap-3 text-white bg-gray-700 p-2 rounded-lg">
              <FaUserCircle className="text-gray-400 text-2xl" />
              <span>{participant.name}</span>
              <span className={`ml-auto text-sm ${participant.isMuted ? 'text-red-500' : 'text-green-500'}`}>
                {participant.isMuted ? 'Muted' : 'Active'}
              </span>
            </li>
          ))
        ) : (
          <p className="text-gray-400">No participants yet.</p>
        )}
      </ul>
    </div>
  );
};

export { CallControls, ParticipantList };
export default CallControls;