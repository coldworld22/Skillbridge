import { useState, useEffect } from "react";
import Link from "next/link";
import { FaUserCircle, FaUsers, FaSearch } from "react-icons/fa";
import { getChatConversations } from "@/services/chatService"; // Mock API
import styles from "./ChatList.module.scss";

const ChatList = ({ onSelectChat }) => {
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getChatConversations().then((data) => setConversations(data));
  }, []);

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.header}>
        <FaUsers /> Chats
      </h2>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <FaSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search..."
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Chat List */}
      <ul className={styles.list}>
        {conversations
          .filter((chat) => chat.name.toLowerCase().includes(search.toLowerCase()))
          .map((chat) => (
            <li
              key={chat.id}
              onClick={() => onSelectChat(chat)}
              className={styles.item}
            >
              <FaUserCircle className={styles.avatar} size={28} />
              <div>
                <p className={styles.name}>{chat.name}</p>
                <p className={styles.muted}>{chat.lastMessage}</p>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default ChatList;
