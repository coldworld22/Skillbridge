import { useState } from "react";
import { FaUsers, FaCheck } from "react-icons/fa";

const GroupChat = () => {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);

  const createGroup = () => {
    console.log("Group Created:", groupName, members);
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg text-white">
      <h2 className="text-xl font-bold flex items-center">
        <FaUsers className="mr-2 text-yellow-500" /> Create Group Chat
      </h2>
      <input
        type="text"
        placeholder="Group Name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        className="w-full p-2 mt-2 bg-gray-800 rounded"
      />
      <button onClick={createGroup} className="mt-4 bg-yellow-500 p-2 rounded flex items-center justify-center">
        <FaCheck className="mr-2" /> Create
      </button>
    </div>
  );
};

export default GroupChat;
