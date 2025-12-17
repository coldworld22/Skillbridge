import { useCallback, useEffect, useMemo, useState } from "react";
import socket from "@/services/socketService";

const defaultState = {
  rooms: [],
  assignments: {},
  activeMemberships: {},
};

const useBreakoutRoomManager = ({
  roomId,
  userId,
  userName,
  userRole,
} = {}) => {
  const [state, setState] = useState(defaultState);

  useEffect(() => {
    if (!roomId) return undefined;
    const handleUpdate = (payload) => {
      if (payload?.roomId !== roomId) return;
      setState({
        rooms: Array.isArray(payload.rooms) ? payload.rooms : [],
        assignments: payload.assignments || {},
        activeMemberships: payload.activeMemberships || {},
      });
    };

    socket.emit("breakout-state-request", { roomId });
    socket.on("breakout-update", handleUpdate);
    return () => {
      socket.off("breakout-update", handleUpdate);
    };
  }, [roomId]);

  const createRoom = useCallback(
    (roomName) => {
      if (!roomId || !roomName) return;
      socket.emit("breakout-create-room", { roomId, roomName });
    },
    [roomId],
  );

  const assignToRoom = useCallback(
    (participantId, roomName) => {
      if (!roomId || !participantId || !roomName) return;
      socket.emit("breakout-assign", { roomId, userId: participantId, roomName });
      setState((prev) => ({
        ...prev,
        assignments: {
          ...prev.assignments,
          [participantId]: roomName,
        },
      }));
    },
    [roomId],
  );

  const joinRoom = useCallback(
    (roomName) => {
      if (!roomId) return;
      const targetRoom = roomName || state.assignments[userId] || null;
      socket.emit("breakout-join", { roomId, roomName: targetRoom });
      if (userId) {
        setState((prev) => ({
          ...prev,
          activeMemberships: {
            ...prev.activeMemberships,
            [userId]: targetRoom || "main",
          },
        }));
      }
    },
    [roomId, state.assignments, userId],
  );

  const leaveRoom = useCallback(() => {
    if (!roomId) return;
    socket.emit("breakout-leave", { roomId });
    if (userId) {
      setState((prev) => {
        const nextMemberships = { ...prev.activeMemberships };
        delete nextMemberships[userId];
        return { ...prev, activeMemberships: nextMemberships };
      });
    }
  }, [roomId, userId]);

  const currentRoom = useMemo(() => {
    if (!userId) return "main";
    return state.activeMemberships[userId] || "main";
  }, [state.activeMemberships, userId]);

  const assignedRoom = useMemo(() => {
    if (!userId) return null;
    return state.assignments[userId] || null;
  }, [state.assignments, userId]);

  return {
    rooms: state.rooms,
    createRoom,
    assignToRoom,
    joinRoom,
    leaveRoom,
    currentRoom,
    assignedRoom,
    inRoom: currentRoom !== "main" && Boolean(currentRoom),
    isHost: userRole === "host" || userRole === "co-host",
    participants: [],
    userId,
    userName,
  };
};

export default useBreakoutRoomManager;
