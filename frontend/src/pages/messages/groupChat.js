import { useState, useEffect } from "react";
import Navbar from "@/components/website/sections/Navbar";
import { getGroups } from "@/services/messageService";
import { sendGroupMessage } from "@/services/groupService";
import { motion } from "framer-motion";
import ChatImage from "@/components/shared/ChatImage";
import formatRelativeTime from "@/utils/relativeTime";
import EmojiPicker from "emoji-picker-react";
import MessageInput from "./MessageInput";
import styles from "./messages.module.scss";



import {
  FaUsers, FaPaperPlane, FaPlus, FaFileUpload, FaSmile, FaUserCircle
} from "react-icons/fa";

const GroupChatPage = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [emojiPicker, setEmojiPicker] = useState(false);

  useEffect(() => {
    getGroups().then((data) => setGroups(data));
  }, []);

  const handleSendMessage = () => {
    if (!selectedGroup || newMessage.trim() === "") return;

    const newChat = {
      id: selectedGroup.messages.length + 1,
      sender: "You",
      text: newMessage,
      timestamp: new Date().toISOString(),
      file
    };

    setGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === selectedGroup.id
          ? { ...group, messages: [...group.messages, newChat] }
          : group
      )
    );
    setNewMessage("");
    setFile(null);
  };

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>👥 Group Chat</h1>

        {/* Create Group */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Enter group name..."
            className={styles.input}
          />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={() => alert("New group created! (Will connect to API later)")}
          >
            <FaPlus /> Create
          </motion.button>
        </div>

        {/* Group List */}
        <div className={`${styles.grid} ${styles.gridSidebar}`} style={{ marginTop: "1rem" }}>
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>
              <FaUsers color="#fbbf24" /> Available Groups
            </h3>
            <ul className={styles.list}>
              {groups.map((group) => (
                <li
                  key={group.id}
                  className={`${styles.listItem} ${selectedGroup?.id === group.id ? styles.listItemActive : ""}`}
                  onClick={() => setSelectedGroup(group)}
                >
                  {group.groupName}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat Window */}
          {selectedGroup && (
            <motion.div className={`${styles.card}`} style={{ gridColumn: "span 2" }}>
              <h3 className={styles.sectionTitle} style={{ color: "#fbbf24" }}>{selectedGroup.groupName}</h3>
              <p className={styles.subtitle}>Participants: {selectedGroup.participants.join(", ")}</p>

              {/* Messages */}
              <div className={styles.chatWindow}>
                {selectedGroup.messages.map((msg, index) => (
                  <motion.div key={index} className={`${styles.bubble} ${msg.sender === "You" ? styles.bubbleSelf : ""}`} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}
                  >
                    <FaUserCircle className={styles.avatar} />
                    <div>
                      <strong>{msg.sender}</strong>
                      <p>{msg.text}</p>
                      {msg.file && (
                        <ChatImage
                          src={msg.file}
                          alt="Attachment"
                          className={styles.attachmentImage}
                          width={64}
                          height={64}
                        />
                      )}
                      <p className={styles.subtitle}>{formatRelativeTime(msg.timestamp)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input with Emoji Picker */}
              <MessageInput onSendMessage={handleSendMessage} />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GroupChatPage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../../next-i18next.config.js';

export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'], nextI18NextConfig)),
    },
  };
}
