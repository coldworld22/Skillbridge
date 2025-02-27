import { useState, useEffect } from "react";
import Link from "next/link";
import { FaUserCircle, FaUsers, FaSearch } from "react-icons/fa";
import { getChatConversations } from "@/services/chatService"; // Mock API

const ChatList = ({ onSelectChat }) => {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getChatConversations().then((data) => setConversations(data));
  }, []);

  return (
    <div className="w-1/3 bg-gray-900 text-white h-full p-4 border-r border-gray-700">
      <h2 className="text-lg font-bold mb-4 flex items-center">
        <FaUsers className="mr-2" /> Chats
      </h2>

      {/* Search Bar */}
      <div className="flex bg-gray-800 p-2 rounded-lg mb-4">
        <FaSearch className="text-gray-500 mt-1 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full bg-transparent text-white focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Chat List */}
      <ul className="space-y-2">
        {conversations
          .filter((chat) => chat.name.toLowerCase().includes(search.toLowerCase()))
          .map((chat) => (
            <li
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className="p-3 flex items-center cursor-pointer hover:bg-gray-800 rounded-lg transition"
            >
              <FaUserCircle className="text-3xl text-yellow-500 mr-3" />
              <div>
                <p className="font-bold">{chat.name}</p>
                <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ChatList;
