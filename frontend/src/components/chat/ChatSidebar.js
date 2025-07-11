import { useState, useEffect } from "react";
import ChatImage from "../shared/ChatImage";
import { API_BASE_URL } from "@/config/config";
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
  const [searchFilter, setSearchFilter] = useState("all");
  const [pinnedChats, setPinnedChats] = useState([]);

  const getAvatarUrl = (url) => {
    if (!url) return "/images/default-avatar.png";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${API_BASE_URL}${url}`;
  };

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

    const fields = [];
    if (searchFilter === "name" || searchFilter === "all") fields.push(user.name);
    if (searchFilter === "email" || searchFilter === "all") fields.push(user.email);
    if (searchFilter === "phone" || searchFilter === "all") fields.push(user.phone);

    return fields.some((f) => f && f.toLowerCase().includes(term));
  });

  // ✅ Function to Pin/Unpin Chats
  const togglePinChat = (chat) => {
    setPinnedChats((prev) =>
      prev.some((pinned) => pinned.id === chat.id)
        ? prev.filter((pinned) => pinned.id !== chat.id)
        : [...prev, chat]
    );
  };

  const handleSendEmail = (email, e) => {
    e?.stopPropagation();
    if (email) {
      window.location.href = `mailto:${email}?subject=Let's Chat&body=Hello!`;
    } else {
      alert("Email is missing!");
    }
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
            placeholder="Search by name, email or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-3 py-2 bg-gray-700 text-white w-full rounded-md focus:outline-none"
          />
        </div>
        <select
          className="bg-gray-700 text-white p-2 rounded-md focus:outline-none"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="name">Name</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
        </select>
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
              <p className="text-white font-semibold flex-1">{chat.name}</p>
              {chat.email && (
                <button
                  className="text-gray-400 hover:text-yellow-500"
                  onClick={(e) => handleSendEmail(chat.email, e)}
                >
                  <FaEnvelope />
                </button>
              )}
              <button
                className="text-gray-400 hover:text-yellow-500"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinChat(chat);
                }}
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
              <ChatImage
                src={getAvatarUrl(user.profileImage)}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-yellow-500"
                width={40}
                height={40}
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

            {user.email && (
              <button
                className="text-gray-400 hover:text-yellow-500"
                onClick={(e) => handleSendEmail(user.email, e)}
              >
                <FaEnvelope />
              </button>
            )}

            {/* ⭐ Pin Chat */}
            <button
              className="text-gray-400 hover:text-yellow-500"
              onClick={(e) => {
                e.stopPropagation();
                togglePinChat(user);
              }}
            >
              <FaStar />
            </button>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-gray-400 text-center">No chats found.</p>
        )}
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
              <ChatImage
                src={getAvatarUrl(user.profileImage)}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-gray-500"
                width={40}
                height={40}
              />
              <p className="text-white font-semibold flex-1">{user.name}</p>
              {user.email && (
                <button
                  className="text-gray-400 hover:text-yellow-500"
                  onClick={(e) => handleSendEmail(user.email, e)}
                >
                  <FaEnvelope />
                </button>
              )}
            </div>
          ))}
      </div>
    </aside>
  );
};

export default ChatSidebar;
