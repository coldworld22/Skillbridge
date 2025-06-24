import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import Peer from "simple-peer";

export default function useVideoCall(roomId, userName = "User", role = "participant") {
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState(null);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState(null);
  const socketRef = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    socketRef.current = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    );
    const initMedia = async () => {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: selectedAudioInput ? { deviceId: selectedAudioInput } : true,
      });
      setStream(mediaStream);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputDevices(devices.filter((d) => d.kind === "audioinput"));
      setAudioOutputDevices(devices.filter((d) => d.kind === "audiooutput"));
      if (!selectedAudioInput) {
        const defaultInput = devices.find((d) => d.kind === "audioinput");
        setSelectedAudioInput(defaultInput?.deviceId || null);
      }
      if (!selectedAudioOutput) {
        const defaultOutput = devices.find((d) => d.kind === "audiooutput");
        setSelectedAudioOutput(defaultOutput?.deviceId || null);
      }

      socketRef.current.emit("join-room", {
        roomId,
        name: userName,
        role,
      });

      socketRef.current.on("all-users", (users) => {
          const peers = [];
          users.forEach((userID) => {
            const peer = createPeer(userID, socketRef.current.id, mediaStream);
            peersRef.current.push({ peerID: userID, peer });
            peers.push({ peerID: userID, peer });
          });
          setPeers(peers);
        });

      socketRef.current.on("user-joined", (payload) => {
        const peer = addPeer(payload.signal, payload.callerID, mediaStream);
        peersRef.current.push({ peerID: payload.callerID, peer });
        setPeers((users) => [...users, { peerID: payload.callerID, peer }]);
      });

      socketRef.current.on("receiving-returned-signal", (payload) => {
        const item = peersRef.current.find((p) => p.peerID === payload.id);
        if (item) item.peer.signal(payload.signal);
      });

      socketRef.current.on("user-disconnected", (id) => {
        setPeers((prev) => prev.filter((p) => p.peerID !== id));
      });
    };

    initMedia();
    const handleDeviceChange = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputDevices(devices.filter((d) => d.kind === "audioinput"));
      setAudioOutputDevices(devices.filter((d) => d.kind === "audiooutput"));
    };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      socketRef.current.disconnect();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
      });
    });
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.on("signal", (signal) => {
      socketRef.current.emit("returning-signal", { signal, callerID });
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const toggleAudio = useCallback(() => {
    if (!stream) return;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  }, [stream]);

  const toggleVideo = useCallback(() => {
    if (!stream) return;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    });
  }, [stream]);

  const changeAudioInput = async (deviceId) => {
    if (!stream) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId },
      });
      const newTrack = newStream.getAudioTracks()[0];
      const oldTrack = stream.getAudioTracks()[0];
      stream.removeTrack(oldTrack);
      stream.addTrack(newTrack);
      peersRef.current.forEach(({ peer }) => {
        if (peer.replaceTrack) {
          peer.replaceTrack(oldTrack, newTrack, stream);
        }
      });
      oldTrack.stop();
      setSelectedAudioInput(deviceId);
    } catch (err) {
      console.error("Failed to switch microphone", err);
    }
  };

  const changeAudioOutput = (deviceId) => {
    setSelectedAudioOutput(deviceId);
    document.querySelectorAll("video").forEach((video) => {
      if (typeof video.sinkId !== "undefined") {
        video
          .setSinkId(deviceId)
          .catch((e) => console.warn("Failed to set output device", e));
      }
    });
  };

  return {
    localStream: stream,
    peers,
    toggleAudio,
    toggleVideo,
    changeAudioInput,
    changeAudioOutput,
    audioInputDevices,
    audioOutputDevices,
    selectedAudioInput,
    selectedAudioOutput,
    isMuted,
    isVideoOff,
  };
}
