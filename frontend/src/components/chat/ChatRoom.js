import { useState, useEffect } from "react";
import socket from "@/services/socketService";
import { FaPaperPlane, FaSmile } from "react-icons/fa";
import styles from "./ChatRoom.module.scss";

const ChatRoom = ({ username, room }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.emit("joinRoom", { username, room });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("message");
    };
  }, [room]);

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("chatMessage", message);
      setMessage("");
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>💬 Group Chat</h3>
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <p key={index} className={styles.message}>{msg}</p>
        ))}
      </div>
      <div className={styles.inputRow}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className={styles.input}
        />
        <button onClick={sendMessage} className={styles.sendButton}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
