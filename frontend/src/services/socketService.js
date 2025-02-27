import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:4000"; // Change this when backend is ready

const socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
});

export default socket;
