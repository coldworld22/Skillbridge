import { useState, useEffect } from "react";
import mockUsers from "@/mocks/sampleUsers.json"; // ✅ Import mock data

const useLastSeen = (userId) => {
  const [lastSeen, setLastSeen] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Simulate fetching user data (Replace with API Call)
    const user = mockUsers.find((user) => user.id === userId);
    if (user) {
      setIsOnline(user.isOnline);
      setLastSeen(user.isOnline ? "Online" : `Last seen ${user.lastSeen}`);
    }
  }, [userId]);

  return { lastSeen, isOnline };
};

export default useLastSeen;
