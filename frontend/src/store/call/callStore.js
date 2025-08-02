import { create } from "zustand";
import socket from "@/services/socketService";

const useCallStore = create((set, get) => ({
  incomingCall: null,
  outgoingCall: null,
  acceptedCall: null,
  declined: false,
  listening: false,
  listen: () => {
    if (get().listening) return;
    socket.on("incoming-call", (data) => {
      set({ incomingCall: data });
    });
    socket.on("call-accepted", (data) => {
      set({ acceptedCall: data, outgoingCall: null });
    });
    socket.on("call-declined", () => {
      set({ declined: true, outgoingCall: null });
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
  clearStatus: () => set({ acceptedCall: null, declined: false }),
}));

export default useCallStore;
