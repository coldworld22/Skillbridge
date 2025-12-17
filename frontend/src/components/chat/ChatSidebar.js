import { useState, useEffect } from "react";
import ChatImage from "../shared/ChatImage";
import { API_BASE_URL } from "@/config/config";
import { FaEnvelope, FaSearch, FaStar, FaWhatsapp } from "react-icons/fa";
import styles from "./ChatSidebar.module.scss";

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
    <aside className={styles.sidebar}>
      <h2 className={styles.title}>💬 Chats</h2>

      {/* 🔍 Search Bar */}
      <div className={styles.searchRow}>
        <div className={styles.searchWrap}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by name, email or phone"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <select
          className={styles.select}
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
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>⭐ Pinned Chats</h3>
          {pinnedChats.map((chat) => (
            <div
              key={chat.id}
              className={styles.card}
              onClick={() => setSelectedChat(chat)}
            >
              <p className={styles.name}>{chat.name}</p>
              <button
                className={styles.actionIcon}
                onClick={(e) => handleWhatsAppChat(chat.phone, e)}
              >
                <FaWhatsapp />
              </button>
              <button
                className={styles.actionIcon}
                onClick={(e) => handleSendEmail(chat.email, e)}
              >
                <FaEnvelope />
              </button>
              <button
                className={styles.actionIcon}
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
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>📌 Recent Chats</h3>
        <div className={styles.section}>
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`${styles.card} ${
                selectedChat?.id === user.id ? styles.cardActive : ""
              }`}
              onClick={() => setSelectedChat(user)}
            >
              <div className={styles.avatarWrap}>
                <ChatImage
                  src={getAvatarUrl(user.profileImage || user.profile_image || user.avatar_url)}
                  alt={user.name}
                  className={styles.avatar}
                  width={40}
                  height={40}
                />
                <span
                  className={styles.statusDot}
                  style={{ background: isUserOnline(user) ? "#22c55e" : "#9ca3af" }}
                />
              </div>

              <div className={styles.meta}>
                <p className={styles.name}>{user.name}</p>
                <p className={styles.muted}>
                  {user.lastMessage || user.last_message || "No messages yet"}
                </p>
              </div>

              {user.unreadMessages > 0 && (
                <div className={styles.badge}>
                  <FaEnvelope /> {user.unreadMessages}
                </div>
              )}

              <button
                className={styles.actionIcon}
                onClick={(e) => handleWhatsAppChat(user.phone, e)}
              >
                <FaWhatsapp />
              </button>
              <button
                className={styles.actionIcon}
                onClick={(e) => handleSendEmail(user.email, e)}
              >
                <FaEnvelope />
              </button>
              <button
                className={styles.actionIconSecondary}
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
            <p className={styles.empty}>No chats found.</p>
          )}
        </div>
      </section>

      {/* 👥 Groups */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>👥 Groups</h3>
        <div className={styles.section}>
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`${styles.card} ${
                selectedChat?.id === group.id ? styles.cardActive : ""
              }`}
              onClick={() => setSelectedChat({ ...group, isGroup: true })}
            >
              <ChatImage
                src={getGroupAvatar(group)}
                alt={group.name}
                className={styles.avatar}
                width={40}
                height={40}
              />
              <div className={styles.meta}>
                <p className={styles.name}>{group.name}</p>
                <p className={styles.muted}>
                  {group.lastMessage || group.last_message || "No messages yet"}
                </p>
              </div>
              {group.unreadMessages > 0 && (
                <div className={styles.badge}>
                  <FaEnvelope /> {group.unreadMessages}
                </div>
              )}
              <button
                className={styles.actionIcon}
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
            <p className={styles.empty}>No groups found.</p>
          )}
        </div>
      </section>

      {/* 🟢 Suggested Users */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>🏆 Suggested Users</h3>
        <div className={styles.section}>
          {users
            .filter((user) => !user.lastMessage && !user.last_message)
            .slice(0, 3)
            .map((user) => (
              <div
                key={user.id}
                className={styles.card}
                onClick={() => setSelectedChat(user)}
              >
                <ChatImage
                  src={getAvatarUrl(user.profileImage || user.profile_image || user.avatar_url)}
                  alt={user.name}
                  className={styles.avatar}
                  width={40}
                  height={40}
                />
                <p className={styles.name}>{user.name}</p>
                <button
                  className={styles.actionIcon}
                  onClick={(e) => handleWhatsAppChat(user.phone, e)}
                >
                  <FaWhatsapp />
                </button>
                <button
                  className={styles.actionIcon}
                  onClick={(e) => handleSendEmail(user.email, e)}
                >
                  <FaEnvelope />
                </button>
              </div>
            ))}
          {users.filter((user) => !user.lastMessage && !user.last_message).length === 0 && (
            <p className={styles.empty}>You're all caught up with recent chats.</p>
          )}
        </div>
      </section>
    </aside>
  );
};

export default ChatSidebar;
