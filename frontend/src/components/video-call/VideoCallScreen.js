import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import VideoGrid from "./VideoGrid";
import CallControls from "./CallControls";
import ParticipantList from "./ParticipantList";
import ChatDuringCall from "./ChatDuringCall";
import EmojiReactions from "./EmojiReactions";
import LiveTranscription from "./LiveTranscription";
import ScreenSharing from "./ScreenSharing";
import { FaExpand, FaCompress, FaUsers, FaCommentDots, FaMicrophoneSlash, FaHandPaper, FaRecordVinyl } from "react-icons/fa";

const VideoCallScreen = ({ chatId }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isBlurBackground, setIsBlurBackground] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        console.warn("Fullscreen mode not supported");
      });
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
      className={`flex flex-col items-center justify-center h-screen w-screen bg-gray-900 text-white transition-all duration-300 ${isFullScreen ? "fixed top-0 left-0 w-full h-full" : ""}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {isCallActive ? (
        <>
          <div className="flex flex-col md:flex-row w-full h-full p-4 gap-4">
            <div className="flex-1 relative border-4 border-yellow-500 rounded-lg p-2">
              <VideoGrid chatId={chatId} isBlurBackground={isBlurBackground} />
              <motion.div className="absolute top-3 right-3 p-2 bg-gray-800 rounded-lg shadow-md text-yellow-400">
                <span className="text-sm">Chat ID: {chatId}</span>
              </motion.div>
              <EmojiReactions />
              <LiveTranscription />
              <ScreenSharing />
            </div>

            <div className={`w-full md:w-1/4 bg-gray-800 p-4 rounded-lg shadow-lg border-2 border-yellow-500 ${isParticipantsOpen || isChatOpen ? "block" : "hidden"} md:block`}>
              {isParticipantsOpen && <ParticipantList chatId={chatId} />}
              {isChatOpen && <ChatDuringCall />}
            </div>
          </div>

          <CallControls
            onChatToggle={() => setIsChatOpen(!isChatOpen)}
            onParticipantsToggle={() => setIsParticipantsOpen(!isParticipantsOpen)}
            onMuteToggle={() => setIsMuted(!isMuted)}
            onEndCall={() => router.push("/messages")}
            isMuted={isMuted}
          />

          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-3 bg-gray-700 rounded-full hover:bg-yellow-500 transition" onClick={toggleFullScreen}>
              {isFullScreen ? <FaCompress size={18} /> : <FaExpand size={18} />}
            </button>

            <button className="p-3 bg-gray-700 rounded-full hover:bg-yellow-500 transition" onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}>
              <FaUsers size={18} />
            </button>

            <button className="p-3 bg-gray-700 rounded-full hover:bg-yellow-500 transition" onClick={() => setIsChatOpen(!isChatOpen)}>
              <FaCommentDots size={18} />
            </button>

            <button className={`p-3 rounded-full transition ${isMuted ? "bg-red-500" : "bg-gray-700 hover:bg-yellow-500"}`} onClick={() => setIsMuted(!isMuted)}>
              <FaMicrophoneSlash size={18} />
            </button>

            <button className={`p-3 rounded-full transition ${isHandRaised ? "bg-blue-500" : "bg-gray-700 hover:bg-yellow-500"}`} onClick={() => setIsHandRaised(!isHandRaised)}>
              <FaHandPaper size={18} />
            </button>

            <button className={`p-3 rounded-full transition ${isRecording ? "bg-red-600" : "bg-gray-700 hover:bg-yellow-500"}`} onClick={() => setIsRecording(!isRecording)}>
              <FaRecordVinyl size={18} />
            </button>
          </div>
        </>
      ) : (
        <motion.div className="flex flex-col items-center justify-center h-full">
          <h2 className="text-2xl font-bold text-yellow-400">📴 Call Ended</h2>
          <button onClick={() => setIsCallActive(true)} className="mt-4 px-6 py-2 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-600 transition">
            Rejoin Call
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoCallScreen;