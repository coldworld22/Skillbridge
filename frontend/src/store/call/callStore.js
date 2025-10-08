import { create } from "zustand";
import socket from "@/services/socketService";
import useAuthStore from "@/store/auth/authStore";

const useCallStore = create((set, get) => ({
  incomingCall: null,
  outgoingCall: null,
  acceptedCall: null,
  declined: false,
  listening: false,
  listen: () => {
    const registerSocket = () => {
      const user = useAuthStore.getState().user;
      if (user?.id) {
        socket.emit("register", { userId: user.id });
      }
    };

    // Always register the socket with the current user
    registerSocket();

    if (get().listening) return;

    socket.on("connect", registerSocket);
    socket.on("incoming-call", (data) => {
      set({ incomingCall: data });
    });
    socket.on("call-accepted", (data) => {
      set({ acceptedCall: data, outgoingCall: null });
    });
    socket.on("call-declined", () => {
      set({ declined: true, outgoingCall: null });
    });
    socket.on("call-cancelled", () => {
      set({ incomingCall: null });
    });
    set({ listening: true });
  },
  initiateCall: (info) => set({ outgoingCall: info, declined: false, acceptedCall: null }),
  acceptCall: () => {
    const call = get().incomingCall;
    if (!call) return;
    socket.emit("call-accepted", call);
    set({ incomingCall: null, acceptedCall: call });
  },
  declineCall: () => {
    const call = get().incomingCall;
    if (!call) return;
    socket.emit("call-declined", call);
    set({ incomingCall: null, declined: true });
  },
  cancelCall: () => {
    const call = get().outgoingCall;
    if (!call) return;
    socket.emit("call-cancelled", call);
    set({ outgoingCall: null });
  },
  clearStatus: () => set({ acceptedCall: null, declined: false }),
}));

export default useCallStore;
