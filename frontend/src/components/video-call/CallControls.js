import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaUsers,
  FaCommentDots,
  FaRecordVinyl,
  FaStopCircle,
  FaDownload,
  FaCog,
} from "react-icons/fa";

const CallControls = ({
  onChatToggle,
  onParticipantsToggle,
  onEndCall,
  onMuteToggle,
  onVideoToggle,
  onSettingsToggle,
  userRole,
  isRecording,
  startRecording,
  stopRecording,
  downloadRecording,
  isMuted,
  isVideoOff,
}) => {
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4 bg-gray-800 p-3 rounded-full shadow-lg transition-all">
      <button
        onClick={onMuteToggle}
        className={`p-3 rounded-full transition ${isMuted ? "bg-red-500" : "bg-green-500"}`}
      >
        {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
      </button>
      <button
        onClick={onVideoToggle}
        className={`p-3 rounded-full transition ${isVideoOff ? "bg-yellow-700" : "bg-blue-500"}`}
      >
        {isVideoOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
      </button>
      <button
        className="p-3 bg-gray-700 rounded-full hover:bg-yellow-500 transition"
        onClick={onParticipantsToggle}
      >
        <FaUsers size={18} />
      </button>
      <button
        className="p-3 bg-gray-700 rounded-full hover:bg-yellow-500 transition"
        onClick={onChatToggle}
      >
        <FaCommentDots size={18} />
      </button>
      <button
        className="p-3 bg-gray-700 rounded-full hover:bg-yellow-500 transition"
        onClick={onSettingsToggle}
      >
        <FaCog size={18} />
      </button>
      <button
        className="p-3 bg-red-500 rounded-full hover:scale-110 transition"
        onClick={onEndCall}
      >
        <FaPhoneSlash size={18} />
      </button>

      {(userRole === "host" || userRole === "co-host") && (
        <>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full transition ${isRecording ? "bg-red-600" : "bg-gray-700 hover:bg-yellow-500"}`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <FaStopCircle size={18} />
            ) : (
              <FaRecordVinyl size={18} />
            )}
          </button>

          {!isRecording && (
            <button
              onClick={downloadRecording}
              className="p-3 bg-gray-700 rounded-full hover:bg-green-500 transition"
              title="Download Recording"
            >
              <FaDownload size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CallControls;
