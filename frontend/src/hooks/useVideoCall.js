import { useEffect, useRef, useState, useCallback } from "react";
import Peer from "simple-peer";
import { toast } from "react-toastify";
import logger from "@/utils/logger";
import socketClient from "@/services/socketService";

export default function useVideoCall({
  roomId,
  userId,
  userName = "User",
  requestedRole = "participant",
}) {
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
  const [role, setRole] = useState(requestedRole);
  const [joinError, setJoinError] = useState(null);
  const [sessionStatus, setSessionStatus] = useState({ live: false });
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [waitingRequests, setWaitingRequests] = useState([]);
  const [participantsState, setParticipantsState] = useState([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const socketRef = useRef();
  const peersRef = useRef([]);
  const leaveCallRef = useRef(() => {});
  const screenStreamRef = useRef(null);
  const originalVideoTrackRef = useRef(null);
  const MEDIA_WARNING_ID = "media-controls-warning";

  const notifyMediaUnavailable = useCallback(() => {
    toast.warn("Camera and microphone are not ready yet. Please allow permissions and try again.", {
      toastId: MEDIA_WARNING_ID,
    });
  }, []);

  const teardownMedia = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
  }, [stream]);

  useEffect(() => {
    const socket = socketClient;
    socketRef.current = socket;

    const handleJoinAccepted = (payload) => {
      if (payload?.roomId !== roomId) return;
      setJoinError(null);
      setWaitingForApproval(false);
      if (payload?.role) setRole(payload.role);
      if (payload?.session) setSessionStatus(payload.session);
      if (
        (payload?.role === "host" || payload?.role === "co-host") &&
        socketRef.current
      ) {
        socketRef.current.emit("waiting-room:request", { roomId });
      }
    };

    const handleJoinDenied = (payload) => {
      if (payload?.roomId && payload.roomId !== roomId) return;
      const reason = payload?.reason || "forbidden";
      if (reason === "left_waiting") {
        setWaitingForApproval(false);
        return;
      }
      setWaitingForApproval(false);
      setJoinError(reason);
      teardownMedia();
    };

    const handleJoinPending = (payload) => {
      if (payload?.roomId && payload.roomId !== roomId) return;
      setWaitingForApproval(true);
      if (payload?.requestId) {
        socketRef.current.pendingRequestId = payload.requestId;
      }
    };

    const handleWaitingRoom = (payload) => {
      if (payload?.roomId !== roomId) return;
      setWaitingRequests(Array.isArray(payload?.requests) ? payload.requests : []);
    };

    const syncParticipants = (updater) => {
      setParticipantsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return next;
      });
    };

    const handleParticipantList = (list) => {
      if (!Array.isArray(list)) return;
      setParticipantsState(list);
    };

    const handleParticipantJoined = (participant) => {
      if (!participant) return;
      syncParticipants((prev) => {
        if (prev.find((p) => p.id === participant.id)) return prev;
        return [...prev, participant];
      });
    };

    const handleParticipantLeft = ({ id }) => {
      if (!id) return;
      syncParticipants((prev) => prev.filter((p) => p.id !== id));
    };

    const handleParticipantUpdated = (participant) => {
      if (!participant) return;
      syncParticipants((prev) =>
        prev.map((p) => (p.id === participant.id ? { ...p, ...participant } : p)),
      );
      if (
        participant.id &&
        socketRef.current &&
        participant.id === socketRef.current.id &&
        participant.role &&
        participant.role !== role
      ) {
        setRole(participant.role);
        if (
          (participant.role === "host" || participant.role === "co-host") &&
          socketRef.current
        ) {
          socketRef.current.emit("waiting-room:request", { roomId });
        }
      }
    };

    const handleParticipantRemoved = ({ id }) => {
      if (!id) return;
      syncParticipants((prev) => prev.filter((p) => p.id !== id));
      if (socketRef.current && socketRef.current.id === id) {
        setJoinError("removed");
        leaveCallRef.current();
      }
    };

    const handleSessionStatus = (payload) => {
      if (payload?.roomId !== roomId) return;
      setSessionStatus(payload);
    };

    socket.on('join-accepted', handleJoinAccepted);
    socket.on('join-denied', handleJoinDenied);
    socket.on('join-pending', handleJoinPending);
    socket.on('session-status', handleSessionStatus);
    socket.on('waiting-room', handleWaitingRoom);
    socket.on('participant-list', handleParticipantList);
    socket.on('participant-joined', handleParticipantJoined);
    socket.on('participant-left', handleParticipantLeft);
    socket.on('participant-updated', handleParticipantUpdated);
    socket.on('participant-removed', handleParticipantRemoved);

    return () => {
      socket.off('join-accepted', handleJoinAccepted);
      socket.off('join-denied', handleJoinDenied);
      socket.off('session-status', handleSessionStatus);
      socket.off('join-pending', handleJoinPending);
      socket.off('waiting-room', handleWaitingRoom);
      socket.off('participant-list', handleParticipantList);
      socket.off('participant-joined', handleParticipantJoined);
      socket.off('participant-left', handleParticipantLeft);
      socket.off('participant-updated', handleParticipantUpdated);
      socket.off('participant-removed', handleParticipantRemoved);
    };
  }, [roomId, teardownMedia, role]);

  const stopScreenShare = useCallback(() => {
    if (!screenStreamRef.current || !stream) return;
    const [screenTrack] = screenStreamRef.current.getVideoTracks();
    if (screenTrack) {
      screenTrack.stop();
      stream.removeTrack(screenTrack);
    }

    const originalTrack = originalVideoTrackRef.current;
    if (originalTrack) {
      stream.addTrack(originalTrack);
      peersRef.current.forEach(({ peer }) => {
        if (peer.replaceTrack && screenTrack) {
          peer.replaceTrack(screenTrack, originalTrack, stream);
        }
      });
    }

    originalVideoTrackRef.current = null;
    screenStreamRef.current = null;
    setIsScreenSharing(false);
  }, [stream]);

  const leaveCall = useCallback(() => {
    try {
      if (socketRef.current && roomId) {
        socketRef.current.emit('leave-room', { roomId });
      }
    } catch (err) {
      logger.warn('Failed to emit leave-room', err);
    }

    peersRef.current.forEach(({ peer }) => {
      try {
        peer.destroy?.();
      } catch (err) {
        logger.warn('Failed to destroy peer', err);
      }
    });
    peersRef.current = [];
    setPeers([]);
    stopScreenShare();
    teardownMedia();
    setParticipantsState([]);
    setWaitingRequests([]);
    setWaitingForApproval(false);
    setSessionStatus({ live: false });
  }, [roomId, stopScreenShare, teardownMedia]);

  useEffect(() => {
    leaveCallRef.current = leaveCall;
  }, [leaveCall]);

  const approveWaitingRequest = useCallback(
    (requestId) => {
      if (!socketRef.current || !roomId || !requestId) return;
      socketRef.current.emit("waiting-room:approve", { roomId, requestId });
    },
    [roomId],
  );

  const rejectWaitingRequest = useCallback(
    (requestId) => {
      if (!socketRef.current || !roomId || !requestId) return;
      socketRef.current.emit("waiting-room:reject", { roomId, requestId });
    },
    [roomId],
  );

  useEffect(() => {
    if (!roomId || !socketRef.current) return undefined;
    if (role === "host" || role === "co-host") {
      socketRef.current.emit("waiting-room:request", { roomId });
    } else {
      setWaitingRequests([]);
    }
    return undefined;
  }, [roomId, role]);

  useEffect(() => {
    if (!roomId || !userId) {
      return undefined;
    }
    const socket = socketClient;
    socketRef.current = socket;
    const initMedia = async () => {
      let mediaStream = null;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
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
      } catch (err) {
        logger.error("Failed to get media", err);
        let friendly =
          "Unable to access your camera or microphone. Check browser permissions and try again.";
        if (err?.name === "NotReadableError") {
          friendly =
            "Another application is already using your camera or microphone. Close it (or end other meetings) and try again.";
        } else if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          friendly =
            "Browser permissions blocked access to your camera or microphone. Please allow access and reload.";
        } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
          friendly = "We could not detect any camera or microphone on this device.";
        }
        toast.error(friendly);
        setError(err);
      }

      if (userId) {
        socket.emit("register", { userId });
      }

      socket.emit("join-room", {
        roomId,
        name: userName,
      });

      if (!mediaStream) {
        return;
      }

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
      leaveCallRef.current();
    };
    // We intentionally re-run this setup only when the room changes; device selections
    // are managed via the dedicated change handlers below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userName, userId]);

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
    if (!stream) {
      notifyMediaUnavailable();
      return;
    }
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  }, [stream, notifyMediaUnavailable]);

  const toggleVideo = useCallback(() => {
    if (!stream) {
      notifyMediaUnavailable();
      return;
    }
    stream.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsVideoOff(!track.enabled);
    });
  }, [stream, notifyMediaUnavailable]);

  const startScreenShare = useCallback(async () => {
    if (!stream || isScreenSharing) {
      if (!stream) notifyMediaUnavailable();
      return;
    }
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      const [screenTrack] = screenStream.getVideoTracks();
      if (!screenTrack) return;
      const [currentTrack] = stream.getVideoTracks();
      if (currentTrack) {
        originalVideoTrackRef.current = currentTrack;
        stream.removeTrack(currentTrack);
      }
      stream.addTrack(screenTrack);
      peersRef.current.forEach(({ peer }) => {
        if (peer.replaceTrack && currentTrack) {
          peer.replaceTrack(currentTrack, screenTrack, stream);
        } else if (peer.addTrack) {
          peer.addTrack(screenTrack, stream);
        }
      });
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);
      screenTrack.onended = () => stopScreenShare();
    } catch (err) {
      logger.error("Failed to start screen share", err);
      toast.error("Screen sharing failed. Please check browser permissions.");
    }
  }, [stream, isScreenSharing, stopScreenShare, notifyMediaUnavailable]);

  const changeAudioInput = async (deviceId) => {
    if (!stream) {
      notifyMediaUnavailable();
      return;
    }
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
      toast.error("Unable to switch microphone. Please check your hardware.");
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
    if (!stream) {
      notifyMediaUnavailable();
      return;
    }
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
      toast.error("Unable to switch camera. Please check your hardware.");
      setError(err);
    }
  };

  const mediaReady = Boolean(stream);

  return {
    localStream: stream,
    peers,
    role,
    joinError,
    sessionStatus,
    participants: participantsState,
    waitingRequests,
    waitingForApproval,
    mediaReady,
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
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    leaveCall,
    approveWaitingRequest,
    rejectWaitingRequest,
  };
}
