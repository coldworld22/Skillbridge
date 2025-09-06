import { useState, useEffect } from "react";
import api from "@/services/api/api";

const useLastSeen = (userId) => {
  const [lastSeen, setLastSeen] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const { data } = await api.get(`/users/usersmanagement/${userId}`);
        if (!isMounted) return;
        const user = data?.data || data;
        const online = user?.is_online ?? false;
        setIsOnline(!!online);
        if (online) {
          setLastSeen("Online");
        } else if (user?.last_seen) {
          setLastSeen(`Last seen ${user.last_seen}`);
        } else {
          setLastSeen("Offline");
        }
      } catch (err) {
        if (isMounted) setError("Failed to fetch status");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { lastSeen, isOnline, loading, error };
};

export default useLastSeen;
