import { useState, useEffect } from "react";
import { FaCircle } from "react-icons/fa";
import styles from "./OnlineStatus.module.scss";

const OnlineStatus = ({ userId }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Simulate fetching online status from an API
    const fetchOnlineStatus = async () => {
      const onlineUsers = await new Promise((resolve) =>
        setTimeout(() => resolve([1, 2, 3]), 1000) // Mock online users
      );
      setIsOnline(onlineUsers.includes(userId));
    };

    fetchOnlineStatus();
  }, [userId]);

  return (
    <div className={styles.status}>
      <FaCircle className={`${styles.icon} ${isOnline ? styles.online : ""}`} />
      {isOnline ? "Online" : "Offline"}
    </div>
  );
};

export default OnlineStatus;
