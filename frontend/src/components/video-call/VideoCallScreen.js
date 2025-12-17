import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { motion } from "framer-motion";
import {
  FaExpand,
  FaCompress,
  FaChalkboardTeacher,
  FaUserShield,
  FaClosedCaptioning,
} from "react-icons/fa";

import VideoGrid from "./VideoGrid";
import ParticipantList from "./ParticipantList";
import ChatDuringCall from "./ChatDuringCall";
import EmojiReactions from "./EmojiReactions";
import LiveTranscription from "./LiveTranscription";
import ScreenSharing from "./ScreenSharing";
import CallControls from "./CallControls";
import AudioDeviceSelector from "./AudioDeviceSelector";
import TranscriptionManager from "./TranscriptionManager";
import RaiseHandManager from "./RaiseHandManager";
import useRecordingManager from "./RecordingManager";
import useBreakoutRoomManager from "./BreakoutRoomManager";
import useVideoCall from "@/hooks/useVideoCall";
import useAuthStore from "@/store/auth/authStore";
import styles from "./VideoCallScreen.module.scss";

const roles = {
  HOST: "host",
  CO_HOST: "co-host",
  PARTICIPANT: "participant",
};

const JOIN_ERROR_COPY = {
  auth_required: "Authentication is required before joining this class.",
  not_enrolled: "You are not enrolled in this class.",
  room_not_found: "We could not find this classroom.",
  room_required: "Missing classroom identifier.",
  missing_parameters: "Missing classroom identifier.",
  not_part_of_call: "This private call is restricted to invited participants.",
  user_not_found: "We could not verify your account to join this call.",
  forbidden: "You don't have permission to join this classroom.",
  rejected: "Your instructor rejected this join request.",
  removed: "You've been removed from this live class by the host.",
  internal_error: "We couldn't start the live classroom. Please try again in a few seconds.",
  left_waiting: "Your pending join request was cancelled. Please request access again.",
};

const VideoCallScreen = ({ chatId, userRole = roles.PARTICIPANT, onBreakoutManagerReady }) => {
  const router = useRouter();
  const { t } = useTranslation("dashboard");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
  const user = useAuthStore((state) => state.user);
  const userName = user?.full_name || user?.name || "User";

  const {
    localStream,
    peers,
    role: resolvedRole,
    joinError,
    sessionStatus,
    participants: participantEntries,
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
    changeVideoInput,
    isMuted: hookMuted,
    isVideoOff,
    startScreenShare,
    stopScreenShare,
    isScreenSharing,
    leaveCall,
    approveWaitingRequest,
    rejectWaitingRequest,
    error,
  } = useVideoCall({
    roomId: chatId,
    userId: user?.id,
    userName,
    requestedRole: userRole,
  });

  const { raiseHand, lowerHand, hasRaised, HandQueueDisplay } =
    RaiseHandManager({ roomId: chatId, userId: user?.id, userName, userRole: resolvedRole });
  const {
    isRecording,
    elapsedTime,
    startRecording,
    stopRecording,
    downloadRecording,
  } = useRecordingManager();
  const {
    rooms,
    createRoom,
    assignToRoom,
    joinRoom,
    leaveRoom,
    currentRoom,
    assignedRoom,
    inRoom,
    isHost,
  } = useBreakoutRoomManager({
    roomId: chatId,
    userId: user?.id,
    userName,
    userRole: resolvedRole,
  });

  useEffect(() => {
    if (typeof onBreakoutManagerReady === "function") {
      onBreakoutManagerReady({
        rooms,
        createRoom,
        assignToRoom,
        joinRoom,
        leaveRoom,
        currentRoom,
        assignedRoom,
        inRoom,
        isHost,
        participants: participantEntries,
      });
      return () => onBreakoutManagerReady(null);
    }
    return undefined;
  }, [
    onBreakoutManagerReady,
    rooms,
    createRoom,
    assignToRoom,
    joinRoom,
    leaveRoom,
    currentRoom,
    assignedRoom,
    inRoom,
    isHost,
    participantEntries,
  ]);
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleEndCall = () => {
    leaveCall();
    setIsCallActive(false);
  };

  const handleRejoin = () => {
    router.replace(router.asPath).catch(() => {
      window.location.reload();
    });
  };

  if (joinError) {
    const message = JOIN_ERROR_COPY[joinError] || "Unable to join this classroom.";
    return (
      <div className={styles.errorScreen}>
        {message}
      </div>
    );
  }

  if (waitingForApproval) {
    return (
      <div className={styles.waitingScreen}>
        <p className={styles.waitingTitle}>{t("student_online_class.waiting_for_host")}</p>
        <p className={styles.waitingHint}>
          {t("student_online_class.waiting_for_host_hint")}
        </p>
        <button
          type="button"
          className={styles.buttonGhost}
          onClick={leaveCall}
        >
          {t("student_online_class.cancel_request")}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isCallActive ? (
        <>
          {/* Video Area + Side Panel */}
          <div className={styles.layout}>
            <div className={styles.mainRow}>
              <div className={styles.videoArea}>
                <VideoGrid localStream={localStream} peers={peers} />
                <TranscriptionManager currentSpeaker={userName} />
                <EmojiReactions roomId={chatId} />
                {transcriptionEnabled && (
                  <div className={styles.transcriptionBadge}>
                    <LiveTranscription isEnabled={transcriptionEnabled} />
                  </div>
                )}
                <ScreenSharing
                  isSharing={isScreenSharing}
                  onStart={startScreenShare}
                  onStop={stopScreenShare}
                  disabled={!mediaReady}
                />
                {error && (
                  <div className={styles.mediaError}>
                    {t("student_online_class.media_permission_error")}
                  </div>
                )}
                <div className={styles.codeTag}>
                  <code>{chatId}</code>
                </div>
              </div>
              {(isChatOpen || isParticipantsOpen) && (
                <div className={styles.sidePanel}>
                  {isParticipantsOpen && (
                    <ParticipantList chatId={chatId} userRole={resolvedRole} />
                  )}
                  {isChatOpen && (
                    <ChatDuringCall
                      chatId={chatId}
                      currentUserId={user?.id}
                      userRole={resolvedRole}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Call Controls */}
          <div className={styles.controlsBar}>
            <CallControls
              isMuted={hookMuted}
              isVideoOff={isVideoOff}
              isChatOpen={isChatOpen}
              isParticipantsOpen={isParticipantsOpen}
              onMuteToggle={toggleAudio}
              onVideoToggle={toggleVideo}
              onChatToggle={() => setIsChatOpen(!isChatOpen)}
              onParticipantsToggle={() =>
                setIsParticipantsOpen(!isParticipantsOpen)
              }
              onEndCall={handleEndCall}
              onSettingsToggle={() => setIsSettingsOpen(!isSettingsOpen)}
              userRole={resolvedRole}
              isRecording={isRecording}
              startRecording={startRecording}
              stopRecording={stopRecording}
              downloadRecording={downloadRecording}
              mediaReady={mediaReady}
            />
          </div>

          {isSettingsOpen && (
            <div className={styles.settingsPanel}>
              <AudioDeviceSelector
                audioInputDevices={audioInputDevices}
                audioOutputDevices={audioOutputDevices}
                selectedAudioInput={selectedAudioInput}
                selectedAudioOutput={selectedAudioOutput}
                videoInputDevices={videoInputDevices}
                selectedVideoInput={selectedVideoInput}
                onSelectInput={changeAudioInput}
                onSelectOutput={changeAudioOutput}
                onSelectVideo={changeVideoInput}
              />
            </div>
          )}

          {/* Floating Controls */}
          {isHost && (
            <div className={styles.breakoutPanel}>
              <h3 className={styles.breakoutTitle}>
                🧩 Breakout Rooms
              </h3>
              <input
                type="text"
                placeholder="New room name"
                className={styles.breakoutInput}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createRoom(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
              <div className={styles.breakoutList}>
                {rooms.map((room) => (
                  <div
                    key={room.name}
                    className={styles.breakoutItem}
                  >
                    <span>{room.name}</span>
                    <button
                      className={styles.assignBtn}
                      onClick={() => assignToRoom(userName, room.name)}
                    >
                      Assign Me
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assignedRoom && (
            <div className={styles.assignedPanel}>
              {!inRoom ? (
                <button
                  onClick={joinRoom}
                  className={`${styles.assignedBtn} ${styles.join}`}
                  type="button"
                >
                  Join <strong>{assignedRoom}</strong>
                </button>
              ) : (
                <button
                  onClick={leaveRoom}
                  className={`${styles.assignedBtn} ${styles.leave}`}
                  type="button"
                >
                  Leave <strong>{currentRoom}</strong>
                </button>
              )}
            </div>
          )}

          {isRecording && (
            <div className={styles.recordingBadge}>
              🔴 Recording... {Math.floor(elapsedTime / 60)}:
              {(elapsedTime % 60).toString().padStart(2, "0")}
            </div>
          )}

          {HandQueueDisplay && (
            <div className={styles.handQueue}>
              <HandQueueDisplay />
            </div>
          )}

          {/* Top-Right Buttons */}
          <div className={styles.topButtons}>
            <button
              className={styles.circleBtn}
              onClick={toggleFullScreen}
              type="button"
            >
              {isFullScreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
            </button>
            <button
              className={`${styles.pill} ${
                transcriptionEnabled ? styles.pillCaptionsOn : styles.pillCaptionsOff
              }`}
              onClick={() => setTranscriptionEnabled((prev) => !prev)}
              type="button"
            >
              <FaClosedCaptioning size={14} />
              {transcriptionEnabled ? "Captions on" : "Captions off"}
            </button>
            <button
              className={`${styles.pill} ${hasRaised ? styles.pillHandOn : styles.pillHandOff}`}
              onClick={hasRaised ? lowerHand : raiseHand}
              type="button"
            >
              {hasRaised ? "Lower hand" : "Raise hand"}
            </button>
            {resolvedRole === roles.HOST && (
              <span className={`${styles.pill} ${styles.pillHost}`}>
                <FaChalkboardTeacher /> Host
              </span>
            )}
            {resolvedRole === roles.CO_HOST && (
              <span className={`${styles.pill} ${styles.pillCoHost}`}>
                <FaUserShield /> Co-Host
              </span>
            )}
          </div>
        </>
      ) : (
        <div className={styles.ended}>
          <h2>📴 Call Ended</h2>
          <button
            onClick={handleRejoin}
            className={styles.rejoin}
            type="button"
          >
            Rejoin Call
          </button>
        </div>
      )}
      <div className={styles.statusBadge}>
        <span className={sessionStatus?.live ? styles.live : styles.offline}>
          {sessionStatus?.live ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>
      {error && (
        <div className={styles.waitingCenter}>
          <p>We couldn&apos;t access your camera or microphone.</p>
          <p>
            Make sure your browser has permission to use them and that no other tab or app is already using the device.
            You can still admit students without video; refresh after fixing permissions to broadcast.
          </p>
          <button
            type="button"
            className={styles.buttonGhost}
            onClick={handleRejoin}
          >
            Retry Permissions
          </button>
        </div>
      )}
      {(resolvedRole === roles.HOST || resolvedRole === roles.CO_HOST) &&
        waitingRequests.length > 0 && (
          <div className={styles.waitingCenter}>
            <h3 className={styles.waitingTitle}>
              Waiting room ({waitingRequests.length})
            </h3>
            <div className={styles.waitingList}>
              {waitingRequests.map((request) => (
                <div
                  key={request.id}
                  className={styles.waitingItem}
                >
                  <div>
                    <p>{request.name}</p>
                    <p className={styles.waitingMeta}>
                      {request.requestedAt
                        ? new Date(request.requestedAt).toLocaleTimeString()
                        : "Awaiting decision"}
                    </p>
                  </div>
                  <div className={styles.waitingActions}>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${styles.approve}`}
                      onClick={() => approveWaitingRequest(request.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${styles.reject}`}
                      onClick={() => rejectWaitingRequest(request.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      {(resolvedRole === roles.HOST || resolvedRole === roles.CO_HOST) && (
        <div className={styles.waitingMini}>
          <div className={styles.waitingHeader}>
            <p className={styles.waitingTitle}>Waiting room</p>
            <span className={styles.waitingCount}>
              {waitingRequests.length}
            </span>
          </div>
          {waitingRequests.length === 0 ? (
            <p className={styles.waitingMeta}>No pending requests</p>
          ) : (
            <div className={styles.waitingList}>
              {waitingRequests.map((request) => (
                <div key={request.id} className={styles.waitingItem}>
                  <p>{request.name}</p>
                  <p className={styles.waitingMeta}>
                    Requested {request.requestedAt ? new Date(request.requestedAt).toLocaleTimeString() : "just now"}
                  </p>
                  <div className={styles.waitingActions}>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${styles.approve}`}
                      onClick={() => approveWaitingRequest(request.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${styles.reject}`}
                      onClick={() => rejectWaitingRequest(request.id)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default VideoCallScreen;
