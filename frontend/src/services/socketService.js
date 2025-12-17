import { io } from "socket.io-client";

// Allow overriding the socket server URL via env var, otherwise connect to the
// same host that served the frontend.
const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "";

const socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
});

export default socket;
