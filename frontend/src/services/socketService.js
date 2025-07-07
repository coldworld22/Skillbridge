import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "https://eduskillbridge.net"; // Production socket URL

const socket = io(SOCKET_SERVER_URL, {
  transports: ["websocket"],
});

export default socket;
