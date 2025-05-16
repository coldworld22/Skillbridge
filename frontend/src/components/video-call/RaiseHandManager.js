// components/video-call/RaiseHandManager.js
import { useState, useEffect } from "react";

const RaiseHandManager = ({ userName = "Participant", userRole = "participant" }) => {
  const [queue, setQueue] = useState([]);
  const [hasRaised, setHasRaised] = useState(false);

  const raiseHand = () => {
    if (!hasRaised) {
      const newEntry = {
        name: userName,
        timestamp: new Date().toLocaleTimeString(),
      };
      setQueue((prev) => [...prev, newEntry]);
      setHasRaised(true);

      // Optional: Toast notification
      alert(`✋ ${userName} raised their hand`);
    }
  };

  const lowerHand = () => {
    setQueue((prev) => prev.filter((p) => p.name !== userName));
    setHasRaised(false);
  };

  const resetQueue = () => setQueue([]);

  // Expose controls for host
  const HandQueueDisplay = () => (
    <div className="absolute top-24 right-6 bg-black/70 text-white p-4 rounded-xl max-w-sm">
      <h3 className="text-yellow-400 text-md font-bold mb-2">✋ Raised Hands</h3>
      {queue.length === 0 ? (
        <p className="text-gray-400">No hands raised</p>
      ) : (
        <ul className="space-y-2">
          {queue.map((user, i) => (
            <li key={i} className="flex justify-between">
              <span>{user.name}</span>
              <span className="text-xs text-gray-400">{user.timestamp}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return {
    raiseHand,
    lowerHand,
    hasRaised,
    queue,
    HandQueueDisplay: userRole === "host" ? HandQueueDisplay : null,
  };
};

export default RaiseHandManager;
