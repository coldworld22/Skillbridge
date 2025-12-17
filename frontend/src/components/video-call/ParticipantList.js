// ParticipantList.js
import { useState, useEffect } from "react";
import { FaMicrophoneSlash, FaUserShield, FaTimes } from "react-icons/fa";
import styles from "./ParticipantList.module.scss";
import {
  fetchParticipants,
  muteParticipant,
  removeParticipant,
  makeCoHost,
} from "@/services/videoCallService";
import socket from "@/services/socketService";

const canModerateRole = (role) =>
  role === "host" || role === "co-host";

export default function ParticipantList({ chatId, userRole = "participant" }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canModerate = canModerateRole(userRole);

  useEffect(() => {
    if (!chatId) return;

    let subscribed = true;

    fetchParticipants(chatId)
      .then((data) => {
        if (subscribed) {
          setParticipants(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch(() => {
        if (subscribed) {
          setError("Unable to load participants");
        }
      })
      .finally(() => {
        if (subscribed) setLoading(false);
      });

    const handleParticipantUpdated = (participant) => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participant.id ? { ...p, ...participant } : p
        )
      );
    };

    const handleParticipantRemoved = ({ id }) => {
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    };

    const handleParticipantJoined = (participant) => {
      if (!participant) return;
      setParticipants((prev) => {
        if (prev.find((p) => p.id === participant.id)) return prev;
        return [...prev, participant];
      });
    };

    const handleParticipantList = (list) => {
      if (!Array.isArray(list)) return;
      setParticipants(list);
    };

    const handleParticipantLeft = ({ id }) => {
      if (!id) return;
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    };

    socket.on("participant-updated", handleParticipantUpdated);
    socket.on("participant-removed", handleParticipantRemoved);
    socket.on("participant-joined", handleParticipantJoined);
    socket.on("participant-list", handleParticipantList);
    socket.on("participant-left", handleParticipantLeft);

    return () => {
      socket.off("participant-updated", handleParticipantUpdated);
      socket.off("participant-removed", handleParticipantRemoved);
      socket.off("participant-joined", handleParticipantJoined);
      socket.off("participant-list", handleParticipantList);
      socket.off("participant-left", handleParticipantLeft);
      subscribed = false;
    };
  }, [chatId]);

  const handleMute = async (id, isMuted) => {
    try {
      const updated = await muteParticipant(chatId, id, !isMuted);
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error("Failed to mute participant", err);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeParticipant(chatId, id);
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to remove participant", err);
    }
  };

  const handleMakeCoHost = async (id) => {
    try {
      const updated = await makeCoHost(chatId, id);
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      console.error("Failed to update participant role", err);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>👥 Participants</h3>
      {participants.map((user) => (
        <div
          key={user.id}
          className={styles.card}
        >
          <div>
            <div className={styles.nameRow}>
              {user.name}
              {user.isMuted && (
                <FaMicrophoneSlash className={styles.mute} />
              )}
            </div>
            <div className={styles.role}>{user.role}</div>
          </div>
          {canModerate && user.role !== "host" && (
            <div className={styles.actions}>
              <button
                className={`${styles.button} ${styles.mute}`}
                onClick={() => handleMute(user.id, user.isMuted)}
                type="button"
              >
                <FaMicrophoneSlash />
              </button>
              <button
                className={`${styles.button} ${styles.promote}`}
                onClick={() => handleMakeCoHost(user.id)}
                type="button"
              >
                <FaUserShield />
              </button>
              <button
                className={`${styles.button} ${styles.remove}`}
                onClick={() => handleRemove(user.id)}
                type="button"
              >
                <FaTimes />
              </button>
            </div>
          )}
        </div>
      ))}
      {loading && <p className={styles.loading}>Loading participants…</p>}
      {error && !loading && <p className={styles.error}>{error}</p>}
    </div>
  );
}
