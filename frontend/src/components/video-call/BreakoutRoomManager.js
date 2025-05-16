import { useState } from "react";

const useBreakoutRoomManager = (userName, userRole) => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("main");
  const [assignedRoom, setAssignedRoom] = useState(null);

  const createRoom = (roomName) => {
    if (!rooms.find((room) => room.name === roomName)) {
      setRooms((prev) => [...prev, { name: roomName, members: [] }]);
    }
  };

  const assignToRoom = (participant, roomName) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.name === roomName
          ? { ...room, members: [...room.members, participant] }
          : {
              ...room,
              members: room.members.filter((p) => p !== participant),
            }
      )
    );
    if (participant === userName) {
      setAssignedRoom(roomName);
    }
  };

  const joinRoom = () => {
    if (assignedRoom) {
      setCurrentRoom(assignedRoom);
    }
  };

  const leaveRoom = () => {
    setCurrentRoom("main");
  };

  return {
    rooms,
    createRoom,
    assignToRoom,
    joinRoom,
    leaveRoom,
    currentRoom,
    assignedRoom,
    inRoom: currentRoom !== "main",
    isHost: userRole === "host",
  };
};

export default useBreakoutRoomManager;
