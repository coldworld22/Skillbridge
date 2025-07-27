import { useState, useEffect } from "react";
import mockUsers from "@/mocks/sampleUsers.json"; // ✅ Import mock data

const useLastSeen = (userId) => {
  const [lastSeen, setLastSeen] = useState(null);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Simulate fetching user data (Replace with API Call)
    const user = mockUsers.find((user) => user.id === userId);
    if (user) {
      const online =
        user.isOnline !== undefined ? user.isOnline : user.status === "online";
      setIsOnline(online);
      if (online) {
        setLastSeen("Online");
      } else if (user.lastSeen) {
        setLastSeen(`Last seen ${user.lastSeen}`);
      } else {
        setLastSeen("Offline");
      }
    }
  }, [userId]);

  return { lastSeen, isOnline };
};

export default useLastSeen;
