import { io } from "socket.io-client";

// Allow overriding the socket server URL via env var, otherwise connect to the
// same host that served the frontend.
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";

let socketInstance;

const noop = () => {};

const socketShim = {
  on: noop,
  off: noop,
  emit: noop,
  connect: noop,
  disconnect: noop,
  once: noop,
};

export const getSocket = () => {
  if (typeof window === "undefined") {
    return socketShim;
  }

  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
    });
  }

  return socketInstance;
};

export default getSocket;
