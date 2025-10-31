import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import logger from "@/utils/logger";
import socketClient from "@/services/socketService";

export default function useVideoCall(roomId, userName = "User", role = "participant") {
  const [peers, setPeers] = useState([]);
  const [stream, setStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState(null);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState(null);
  const [videoInputDevices, setVideoInputDevices] = useState([]);
  const [selectedVideoInput, setSelectedVideoInput] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    const socket = socketClient;
    socketRef.current = socket;
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoInput ? { deviceId: selectedVideoInput } : true,
          audio: selectedAudioInput ? { deviceId: selectedAudioInput } : true,
        });
        setStream(mediaStream);
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputDevices(devices.filter((d) => d.kind === "audioinput"));
        setAudioOutputDevices(devices.filter((d) => d.kind === "audiooutput"));
        setVideoInputDevices(devices.filter((d) => d.kind === "videoinput"));
        if (!selectedAudioInput) {
          const defaultInput = devices.find((d) => d.kind === "audioinput");
          setSelectedAudioInput(defaultInput?.deviceId || null);
        }
        if (!selectedAudioOutput) {
          const defaultOutput = devices.find((d) => d.kind === "audiooutput");
          setSelectedAudioOutput(defaultOutput?.deviceId || null);
        }
        if (!selectedVideoInput) {
          const defaultVideo = devices.find((d) => d.kind === "videoinput");
          setSelectedVideoInput(defaultVideo?.deviceId || null);
        }

        socket.emit("join-room", {
          roomId,
          name: userName,
          role,
        });

        socket.on("all-users", (users) => {
          const peers = [];
          users.forEach((userID) => {
            const peer = createPeer(userID, socketRef.current.id, mediaStream);
            peersRef.current.push({ peerID: userID, peer });
            peers.push({ peerID: userID, peer });
          });
          setPeers(peers);
        });

        socket.on("user-joined", (payload) => {
          const peer = addPeer(payload.signal, payload.callerID, mediaStream);
          peersRef.current.push({ peerID: payload.callerID, peer });
          setPeers((users) => [...users, { peerID: payload.callerID, peer }]);
        });

        socket.on("receiving-returned-signal", (payload) => {
          const item = peersRef.current.find((p) => p.peerID === payload.id);
          if (item) item.peer.signal(payload.signal);
        });

        socket.on("user-disconnected", (id) => {
          setPeers((prev) => prev.filter((p) => p.peerID !== id));
        });
      } catch (err) {
        logger.error("Failed to get media", err);
        setError(err);
      }
    };

    initMedia();
    const handleDeviceChange = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputDevices(devices.filter((d) => d.kind === "audioinput"));
      setAudioOutputDevices(devices.filter((d) => d.kind === "audiooutput"));
      setVideoInputDevices(devices.filter((d) => d.kind === "videoinput"));
    };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      if (socketRef.current) {
        socketRef.current.off("all-users");
        socketRef.current.off("user-joined");
        socketRef.current.off("receiving-returned-signal");
        socketRef.current.off("user-disconnected");
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
    // We intentionally re-run this setup only when the room changes; device selections
    // are managed via the dedicated change handlers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const defaultIce = [{ urls: "stun:stun.l.google.com:19302" }];
  const iceServers = process.env.NEXT_PUBLIC_TURN_URL
    ? [
        ...defaultIce,
        {
          urls: process.env.NEXT_PUBLIC_TURN_URL,
          username: process.env.NEXT_PUBLIC_TURN_USERNAME,
          credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
        },
      ]
    : defaultIce;

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: { iceServers },
    });
    peer.on("signal", (signal) => {
      socketRef.current.emit("sending-signal", {
        userToSignal,
        callerID,
        signal,
      });
    });
    peer.on("error", (err) => logger.error("Peer error", err));
    peer.on("close", () => logger.warn("Peer connection closed"));
    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: { iceServers },
    });
    peer.on("signal", (signal) => {
      socketRef.current.emit("returning-signal", { signal, callerID });
    });
    peer.on("error", (err) => logger.error("Peer error", err));
    peer.on("close", () => logger.warn("Peer connection closed"));
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
      logger.error("Failed to switch microphone", err);
    }
  };

  const changeAudioOutput = (deviceId) => {
    setSelectedAudioOutput(deviceId);
    document.querySelectorAll("video").forEach((video) => {
      if (typeof video.sinkId !== "undefined") {
        video.setSinkId(deviceId).catch((e) => {
          logger.warn("Failed to set output device", e);
          setError(e);
        });
      }
    });
  };

  const changeVideoInput = async (deviceId) => {
    if (!stream) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId },
      });
      const newTrack = newStream.getVideoTracks()[0];
      const currentTracks = stream.getVideoTracks();
      const oldTrack = currentTracks[0];
      if (oldTrack) {
        stream.removeTrack(oldTrack);
      }
      stream.addTrack(newTrack);
      peersRef.current.forEach(({ peer }) => {
        if (peer.replaceTrack && oldTrack) {
          peer.replaceTrack(oldTrack, newTrack, stream);
        } else if (peer.addTrack) {
          peer.addTrack(newTrack, stream);
        }
      });
      if (oldTrack) oldTrack.stop();
      setSelectedVideoInput(deviceId);
    } catch (err) {
      logger.error("Failed to switch camera", err);
      setError(err);
    }
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
    videoInputDevices,
    selectedVideoInput,
    isMuted,
    isVideoOff,
    error,
    changeVideoInput,
  };
}
