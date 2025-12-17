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
import styles from "./CallControls.module.scss";

const CallControls = ({
  onChatToggle = () => {},
  onParticipantsToggle = () => {},
  onEndCall = () => {},
  onMuteToggle = () => {},
  onVideoToggle = () => {},
  onSettingsToggle = () => {},
  userRole = "participant",
  isRecording = false,
  startRecording = () => {},
  stopRecording = () => {},
  downloadRecording = () => {},
  isMuted = false,
  isVideoOff = false,
  mediaReady = true,
}) => {
  const mediaControlsDisabled = !mediaReady;
  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        onClick={onMuteToggle}
        disabled={mediaControlsDisabled}
        aria-disabled={mediaControlsDisabled}
        title={mediaControlsDisabled ? "Allow camera and microphone to enable controls" : undefined}
        className={`${styles.button} ${mediaControlsDisabled ? styles.disabled : isMuted ? styles.primaryOff : styles.primary}`}
      >
        {isMuted ? <FaMicrophoneSlash size={18} /> : <FaMicrophone size={18} />}
      </button>
      <button
        type="button"
        onClick={onVideoToggle}
        disabled={mediaControlsDisabled}
        aria-disabled={mediaControlsDisabled}
        title={mediaControlsDisabled ? "Allow camera access to toggle video" : undefined}
        className={`${styles.button} ${mediaControlsDisabled ? styles.disabled : isVideoOff ? styles.videoOff : styles.videoOn}`}
      >
        {isVideoOff ? <FaVideoSlash size={18} /> : <FaVideo size={18} />}
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.neutral}`}
        onClick={onParticipantsToggle}
      >
        <FaUsers size={18} />
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.neutral}`}
        onClick={onChatToggle}
      >
        <FaCommentDots size={18} />
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.neutral}`}
        onClick={onSettingsToggle}
      >
        <FaCog size={18} />
      </button>
      <button
        type="button"
        className={`${styles.button} ${styles.end}`}
        onClick={onEndCall}
      >
        <FaPhoneSlash size={18} />
      </button>

      {(userRole === "host" || userRole === "co-host") && (
        <>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`${styles.button} ${isRecording ? styles.recording : styles.neutral}`}
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
              type="button"
              onClick={downloadRecording}
              className={`${styles.button} ${styles.download}`}
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
