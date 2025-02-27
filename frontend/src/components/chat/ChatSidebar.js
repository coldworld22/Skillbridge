import { useState, useEffect } from "react";
import {
  FaPlus,
  FaClock,
  FaEnvelope,
  FaSearch,
  FaFilter,
  FaThumbtack,
  FaStar,
  FaBell,
} from "react-icons/fa";

const ChatSidebar = ({
  users,
  groups,
  setSelectedChat,
  selectedChat,
  onCreateGroup,
}) => {
  const [sortedUsers, setSortedUsers] = useState([]);
  const [sortedGroups, setSortedGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("name");
  const [pinnedChats, setPinnedChats] = useState([]);

  // ✅ Sort users by online status & last active
  useEffect(() => {
    const sortedUsers = [...users].sort((a, b) => {
      if (a.isOnline === b.isOnline) return b.lastActive - a.lastActive;
      return a.isOnline ? -1 : 1;
    });

    const sortedGroups = [...groups].sort((a, b) => b.lastActive - a.lastActive);

    setSortedUsers(sortedUsers);
    setSortedGroups(sortedGroups);
  }, [users, groups]);

  // ✅ Filter users & groups based on search term
  const filteredUsers = sortedUsers.filter((user) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return user.name?.toLowerCase().includes(term);
  });

  // ✅ Function to Pin/Unpin Chats
  const togglePinChat = (chat) => {
    setPinnedChats((prev) =>
      prev.some((pinned) => pinned.id === chat.id)
        ? prev.filter((pinned) => pinned.id !== chat.id)
        : [...prev, chat]
    );
  };

  return (
    <aside className="bg-gray-800 p-4 rounded-lg shadow-lg col-span-1">
      <h2 className="text-lg font-bold text-yellow-400 mb-4">💬 Chats</h2>

      {/* 🔍 Search Bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex items-center bg-gray-700 p-2 rounded-lg w-full">
          <FaSearch className="text-gray-400 absolute left-3" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 bg-gray-700 text-white w-full rounded-md focus:outline-none"
          />
        </div>
      </div>

      {/* 📌 Pinned Chats */}
      {pinnedChats.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-bold text-yellow-400 mb-2">⭐ Pinned Chats</h3>
          {pinnedChats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer bg-gray-700 transition"
              onClick={() => setSelectedChat(chat)}
            >
              <p className="text-white font-semibold">{chat.name}</p>
              <button
                className="text-gray-400 hover:text-yellow-500"
                onClick={() => togglePinChat(chat)}
              >
                <FaThumbtack />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 📌 Recent Chats */}
      <h3 className="text-md font-bold text-yellow-400 mb-2">📌 Recent Chats</h3>
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition ${
              selectedChat?.id === user.id ? "bg-gray-700" : ""
            }`}
            onClick={() => setSelectedChat(user)}
          >
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={user.profileImage || "/default-avatar.png"}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-yellow-500"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-gray-800 ${
                  user.isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>

            {/* User Info */}
            <div className="flex-1">
              <p className="text-white font-semibold">{user.name}</p>
              <p className="text-gray-400 text-sm truncate w-40">
                {user.lastMessage ? user.lastMessage : "No messages yet"}
              </p>
            </div>

            {/* 🔴 Unread Messages */}
            {user.unreadMessages > 0 && (
              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <FaEnvelope /> {user.unreadMessages}
              </div>
            )}

            {/* ⭐ Pin Chat */}
            <button
              className="text-gray-400 hover:text-yellow-500"
              onClick={() => togglePinChat(user)}
            >
              <FaStar />
            </button>
          </div>
        ))}
      </div>

      {/* 🟢 Suggested Users */}
      <h3 className="text-md font-bold text-yellow-400 mt-6">🏆 Suggested Users</h3>
      <div className="space-y-2">
        {users
          .filter((user) => !user.lastMessage)
          .slice(0, 3)
          .map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition"
              onClick={() => setSelectedChat(user)}
            >
              <img
                src={user.profileImage || "/default-avatar.png"}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-gray-500"
              />
              <p className="text-white font-semibold">{user.name}</p>
            </div>
          ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;
