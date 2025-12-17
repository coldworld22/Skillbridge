import { useState } from "react";
import { FaVideo, FaMicrophone, FaPhoneSlash } from "react-icons/fa";
import { toast } from "react-toastify";
import styles from "./VideoPanel.module.scss";

const VideoCall = () => {
  const [isCallActive, setIsCallActive] = useState(false);

  const startCall = () => {
    setIsCallActive(true);
    toast.info("Starting Video Call...");
  };

  const endCall = () => {
    setIsCallActive(false);
    toast.info("Ending Video Call...");
  };

  return (
    <div className={styles.card}>
      {isCallActive ? (
        <div>
          <h3 className={`${styles.title} ${styles.live}`}>🔴 Live Video Call</h3>
          <div className={styles.actions}>
            <button onClick={endCall} className={`${styles.actionButton} ${styles.danger}`} type="button">
              <FaPhoneSlash size={24} />
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3 className={styles.title}>📹 Video Call</h3>
          <p className={styles.subtitle}>Start a video call with your group.</p>
          <div className={styles.actions}>
            <button
              onClick={startCall}
              className={`${styles.actionButton} ${styles.primary}`}
              type="button"
            >
              <FaVideo className={styles.inlineIcon} /> Start Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
