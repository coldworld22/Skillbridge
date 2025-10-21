import { useState, useEffect } from "react";
import ChatImage from "../shared/ChatImage";
import { API_BASE_URL } from "@/config/config";
import { FaEnvelope, FaSearch, FaStar, FaWhatsapp } from "react-icons/fa";

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

  const isUserOnline = (user) =>
    user?.isOnline ?? user?.is_online ?? user?.status === "online";

  const getGroupAvatar = (g) => {
    const src = g.cover_image || g.image || g.avatar_url;
    return getAvatarUrl(src);
  };

  // ✅ Sort users by online status & last active
  useEffect(() => {
    const sortedUsers = [...users].sort((a, b) => {
      const aOnline = isUserOnline(a);
      const bOnline = isUserOnline(b);
      if (aOnline === bOnline)
        return (b.lastActive || b.last_active || 0) - (a.lastActive || a.last_active || 0);
      return aOnline ? -1 : 1;
    });

    const sortedGroups = [...groups].sort(
      (a, b) => (b.lastActive || b.last_active || 0) - (a.lastActive || a.last_active || 0)
    );

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

  const filteredGroups = sortedGroups.filter((group) =>
    group.name?.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

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

  const handleWhatsAppChat = (phone, e) => {
    e?.stopPropagation();
    if (phone) {
      const phoneNumber = phone.replace(/\D/g, "");
      window.open(`https://wa.me/${phoneNumber}`, "_blank");
    } else {
      alert("Phone number is missing!");
    }
  };

  return (
    <aside className="col-span-1 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">💬 Chats</h2>

      {/* 🔍 Search Bar */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3">
          <FaSearch className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-0 bg-transparent py-2 pl-8 pr-3 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none"
          />
        </div>
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none"
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
        <section className="mb-6 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">⭐ Pinned Chats</h3>
          {pinnedChats.map((chat) => (
            <div
              key={chat.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
              onClick={() => setSelectedChat(chat)}
            >
              <p className="flex-1 text-sm font-medium text-gray-900">{chat.name}</p>
              <button
                className="text-gray-400 transition hover:text-green-500"
                onClick={(e) => handleWhatsAppChat(chat.phone, e)}
              >
                <FaWhatsapp />
              </button>
              <button
                className="text-gray-400 transition hover:text-blue-500"
                onClick={(e) => handleSendEmail(chat.email, e)}
              >
                <FaEnvelope />
              </button>
              <button
                className="text-gray-400 transition hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinChat(chat);
                }}
              >
                <FaStar />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* 📌 Recent Chats */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-gray-700">📌 Recent Chats</h3>
        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 transition ${
                selectedChat?.id === user.id
                  ? "border-blue-200 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50"
              }`}
              onClick={() => setSelectedChat(user)}
            >
              <div className="relative">
              <ChatImage
                src={getAvatarUrl(user.profileImage || user.profile_image || user.avatar_url)}
                  alt={user.name}
                  className="h-10 w-10 rounded-full border border-white shadow"
                  width={40}
                  height={40}
                />
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white ${
                    isUserOnline(user) ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="w-40 truncate text-xs text-gray-500">
                  {user.lastMessage || user.last_message || "No messages yet"}
                </p>
              </div>

              {user.unreadMessages > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-600">
                  <FaEnvelope /> {user.unreadMessages}
                </div>
              )}

              <button
                className="text-gray-400 transition hover:text-green-500"
                onClick={(e) => handleWhatsAppChat(user.phone, e)}
              >
                <FaWhatsapp />
              </button>
              <button
                className="text-gray-400 transition hover:text-blue-500"
                onClick={(e) => handleSendEmail(user.email, e)}
              >
                <FaEnvelope />
              </button>
              <button
                className="text-gray-400 transition hover:text-blue-500"
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
            <p className="text-center text-sm text-gray-500">No chats found.</p>
          )}
        </div>
      </section>

      {/* 👥 Groups */}
      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">👥 Groups</h3>
        <div className="space-y-3">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border border-transparent p-3 transition ${
                selectedChat?.id === group.id
                  ? "border-blue-200 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50"
              }`}
              onClick={() => setSelectedChat({ ...group, isGroup: true })}
            >
              <ChatImage
                src={getGroupAvatar(group)}
                alt={group.name}
                className="h-10 w-10 rounded-full border border-white shadow"
                width={40}
                height={40}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                <p className="w-40 truncate text-xs text-gray-500">
                  {group.lastMessage || group.last_message || "No messages yet"}
                </p>
              </div>
              {group.unreadMessages > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-600">
                  <FaEnvelope /> {group.unreadMessages}
                </div>
              )}
              <button
                className="text-gray-400 transition hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinChat({ ...group, isGroup: true });
                }}
              >
                <FaStar />
              </button>
            </div>
          ))}
          {filteredGroups.length === 0 && (
            <p className="text-center text-sm text-gray-500">No groups found.</p>
          )}
        </div>
      </section>

      {/* 🟢 Suggested Users */}
      <section className="mt-6">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">🏆 Suggested Users</h3>
        <div className="space-y-2">
          {users
            .filter((user) => !user.lastMessage && !user.last_message)
            .slice(0, 3)
            .map((user) => (
              <div
                key={user.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                onClick={() => setSelectedChat(user)}
              >
                <ChatImage
                  src={getAvatarUrl(user.profileImage || user.profile_image || user.avatar_url)}
                  alt={user.name}
                  className="h-10 w-10 rounded-full border border-white shadow"
                  width={40}
                  height={40}
                />
                <p className="flex-1 text-sm font-medium text-gray-900">{user.name}</p>
                <button
                  className="text-gray-400 transition hover:text-green-500"
                  onClick={(e) => handleWhatsAppChat(user.phone, e)}
                >
                  <FaWhatsapp />
                </button>
                <button
                  className="text-gray-400 transition hover:text-blue-500"
                  onClick={(e) => handleSendEmail(user.email, e)}
                >
                  <FaEnvelope />
                </button>
              </div>
            ))}
          {users.filter((user) => !user.lastMessage && !user.last_message).length === 0 && (
            <p className="text-sm text-gray-500">You're all caught up with recent chats.</p>
          )}
        </div>
      </section>
    </aside>
  );
};

export default ChatSidebar;
