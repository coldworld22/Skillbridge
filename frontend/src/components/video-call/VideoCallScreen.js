import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  FaExpand,
  FaCompress,
  FaChalkboardTeacher,
  FaUserShield,
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

const roles = {
  HOST: "host",
  CO_HOST: "co-host",
  PARTICIPANT: "participant",
};

const VideoCallScreen = ({ chatId, userRole = roles.PARTICIPANT }) => {
  const router = useRouter();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const userName = user?.full_name || user?.name || "User";

  const {
    localStream,
    peers,
    toggleAudio,
    toggleVideo,
    changeAudioInput,
    changeAudioOutput,
    audioInputDevices,
    audioOutputDevices,
    selectedAudioInput,
    selectedAudioOutput,
    isMuted: hookMuted,
    isVideoOff,
  } = useVideoCall(chatId, userName, userRole);

  const { raiseHand, lowerHand, hasRaised, HandQueueDisplay } =
    RaiseHandManager({ userName, userRole });
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
  } = useBreakoutRoomManager(userName, userRole);

  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch(() => console.warn("Fullscreen not supported"));
    }
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <motion.div
      className="relative flex flex-col h-screen w-screen bg-gray-900 text-white"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isCallActive ? (
        <>
          {/* Video Area + Side Panel */}
          <div className="flex flex-1 flex-col md:flex-row w-full h-full overflow-hidden p-4 gap-6">
            <div className="flex-1 relative border-4 border-yellow-500 rounded-lg p-2 overflow-hidden">
              <VideoGrid localStream={localStream} peers={peers} />
              <TranscriptionManager currentSpeaker={userName} />
              <EmojiReactions />
              <LiveTranscription />
              <ScreenSharing />
              <div className="absolute top-3 right-3 p-2 bg-gray-800 rounded text-yellow-400 shadow">
                <code>{chatId}</code>
              </div>
            </div>
            {(isChatOpen || isParticipantsOpen) && (
              <div className="fixed top-0 right-0 h-full w-full max-w-xs md:static md:w-[300px] bg-gray-800 p-4 rounded-lg shadow border-2 border-yellow-500 z-40 overflow-y-auto">
                {isParticipantsOpen && (
                  <ParticipantList chatId={chatId} userRole={userRole} />
                )}
                {isChatOpen && (
                  <ChatDuringCall chatId={`${chatId}-${currentRoom}`} />
                )}
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
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
            onEndCall={() => setIsCallActive(false)}
            onSettingsToggle={() => setIsSettingsOpen(!isSettingsOpen)}
            userRole={userRole}
          />
          </div>

          {isSettingsOpen && (
            <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 p-4 rounded-lg shadow text-white z-50 w-72">
              <AudioDeviceSelector
                audioInputDevices={audioInputDevices}
                audioOutputDevices={audioOutputDevices}
                selectedAudioInput={selectedAudioInput}
                selectedAudioOutput={selectedAudioOutput}
                onSelectInput={changeAudioInput}
                onSelectOutput={changeAudioOutput}
              />
            </div>
          )}

          {/* Floating Controls */}
          {isHost && (
            <div className="fixed bottom-24 left-4 bg-gray-800 p-4 rounded-lg shadow-xl text-sm text-white space-y-2 z-40 w-64">
              <h3 className="text-yellow-400 font-bold mb-2">
                🧩 Breakout Rooms
              </h3>
              <input
                type="text"
                placeholder="New room name"
                className="p-2 rounded w-full text-black"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createRoom(e.target.value);
                    e.target.value = "";
                  }
                }}
              />
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {rooms.map((room) => (
                  <div
                    key={room.name}
                    className="flex justify-between items-center"
                  >
                    <span>{room.name}</span>
                    <button
                      className="text-xs bg-yellow-500 px-2 py-1 rounded"
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
            <div className="fixed bottom-24 right-4 bg-gray-800 text-white px-4 py-3 rounded shadow z-40 space-x-2 flex items-center">
              {!inRoom ? (
                <button
                  onClick={joinRoom}
                  className="bg-green-500 px-3 py-1 rounded"
                >
                  Join <strong>{assignedRoom}</strong>
                </button>
              ) : (
                <button
                  onClick={leaveRoom}
                  className="bg-red-500 px-3 py-1 rounded"
                >
                  Leave <strong>{currentRoom}</strong>
                </button>
              )}
            </div>
          )}

          {isRecording && (
            <div className="fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse font-semibold">
              🔴 Recording... {Math.floor(elapsedTime / 60)}:
              {(elapsedTime % 60).toString().padStart(2, "0")}
            </div>
          )}

          {HandQueueDisplay && (
            <div className="fixed bottom-36 left-1/2 transform -translate-x-1/2 z-40">
              <HandQueueDisplay />
            </div>
          )}

          {/* Top-Right Buttons */}
          <div className="fixed top-4 right-4 flex flex-col gap-2 z-50 items-end">
            <button
              className="p-3 bg-gray-700 rounded-full hover:bg-yellow-500"
              onClick={toggleFullScreen}
            >
              {isFullScreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
            </button>
            {userRole === roles.HOST && (
              <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-semibold shadow flex items-center gap-2">
                <FaChalkboardTeacher /> Host
              </span>
            )}
            {userRole === roles.CO_HOST && (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow flex items-center gap-2">
                <FaUserShield /> Co-Host
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold text-yellow-400">📴 Call Ended</h2>
          <button
            onClick={() => setIsCallActive(true)}
            className="mt-4 px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600"
          >
            Rejoin Call
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default VideoCallScreen;
