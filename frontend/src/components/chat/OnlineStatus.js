import { useState, useEffect } from "react";
import { FaCircle } from "react-icons/fa";

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
    <div className="flex items-center text-sm text-gray-400">
      <FaCircle className={`mr-2 ${isOnline ? "text-green-500" : "text-gray-500"}`} />
      {isOnline ? "Online" : "Offline"}
    </div>
  );
};

export default OnlineStatus;
