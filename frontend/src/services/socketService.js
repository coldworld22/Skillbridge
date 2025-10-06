import { io } from "socket.io-client";
import logger from "@/utils/logger";

// Allow overriding the socket server URL via env var, otherwise connect to the
// same host that served the frontend.
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";
const LOCALHOST_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const isLocalHostname = (value) => {
  if (!value) {
    return false;
  }

  return LOCALHOST_HOSTNAMES.has(String(value).toLowerCase());
};

const resolveSocketUrl = () => {
  if (typeof window === "undefined") {
    return SOCKET_SERVER_URL || undefined;
  }

  if (!SOCKET_SERVER_URL) {
    return undefined;
  }

  try {
    const candidateUrl = new URL(SOCKET_SERVER_URL, window.location.origin);
    const candidateHost = candidateUrl.hostname;
    const browserHost = window.location.hostname;

    if (isLocalHostname(candidateHost) && !isLocalHostname(browserHost)) {
      logger.warn(
        `Socket URL "${SOCKET_SERVER_URL}" targets localhost but the site is served from "${browserHost}". Falling back to same-origin sockets.`
      );
      return undefined;
    }

    // Preserve the developer-provided value so Socket.IO respects any custom path.
    return candidateUrl.toString();
  } catch (error) {
    logger.warn(
      `Failed to normalise socket URL "${SOCKET_SERVER_URL}": ${error?.message || error}`
    );
    return SOCKET_SERVER_URL;
  }
};

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
    const targetUrl = resolveSocketUrl();
    if (targetUrl) {
      socketInstance = io(targetUrl, {
        transports: ["websocket"],
      });
    } else {
      socketInstance = io({
        transports: ["websocket"],
      });
    }
  }

  return socketInstance;
};

export default getSocket;
