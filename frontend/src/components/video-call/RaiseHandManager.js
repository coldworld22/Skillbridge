// components/video-call/RaiseHandManager.js
import { useState, useEffect, useCallback } from "react";
import socket from "@/services/socketService";
import styles from "./RaiseHandManager.module.scss";

const RaiseHandManager = ({ roomId, userId, userName = "Participant", userRole = "participant" }) => {
  const [queue, setQueue] = useState([]);
  const [hasRaised, setHasRaised] = useState(false);

  useEffect(() => {
    if (!roomId) return undefined;
    const handleQueue = (payload) => {
      if (payload?.roomId !== roomId) return;
      const items = Array.isArray(payload.queue) ? payload.queue : [];
      setQueue(items);
      if (userId) {
        setHasRaised(items.some((entry) => entry.userId === userId));
      }
    };
    socket.on("hand-queue", handleQueue);
    return () => socket.off("hand-queue", handleQueue);
  }, [roomId, userId]);

  const raiseHand = useCallback(() => {
    if (!roomId || hasRaised) return;
    socket.emit("raise-hand", { roomId });
    setHasRaised(true);
  }, [hasRaised, roomId]);

  const lowerHand = useCallback(() => {
    if (!roomId) return;
    socket.emit("lower-hand", { roomId });
    setHasRaised(false);
  }, [roomId]);

  const dismissHand = useCallback(
    (targetUserId) => {
      if (!roomId || !targetUserId) return;
      socket.emit("hands-dismiss", { roomId, userId: targetUserId });
    },
    [roomId],
  );

  const clearHands = useCallback(() => {
    if (!roomId) return;
    socket.emit("hands-clear", { roomId });
  }, [roomId]);

  const HandQueueDisplay =
    userRole === "host" || userRole === "co-host"
      ? () => (
          <div className={styles.panel}>
            <div className={styles.header}>
              <h3 className={styles.title}>✋ Raised Hands</h3>
              {queue.length > 0 && (
                <button
                  type="button"
                  className={styles.clear}
                  onClick={clearHands}
                >
                  Clear
                </button>
              )}
            </div>
            {queue.length === 0 ? (
              <p className={styles.empty}>No hands raised</p>
            ) : (
              <ul className={styles.list}>
                {queue.map((entry) => (
                  <li key={entry.id} className={styles.item}>
                    <div>
                      <span className={styles.name}>{entry.name}</span>
                      <span className={styles.time}>
                        {new Date(entry.raisedAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.lower}
                      onClick={() => dismissHand(entry.userId)}
                    >
                      Lower
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      : null;

  return {
    raiseHand,
    lowerHand,
    hasRaised,
    queue,
    HandQueueDisplay,
  };
};

export default RaiseHandManager;
