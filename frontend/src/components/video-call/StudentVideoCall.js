import { useState } from "react";
import VideoGrid from "./VideoGrid";
import CallControls from "./CallControls";
import ParticipantList from "./ParticipantList";
import ChatDuringCall from "./ChatDuringCall";
import styles from "./SimpleCallScreen.module.scss";

const StudentVideoCall = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);

  return (
    <div className={styles.container}>
      <div className={styles.body}>
        {isCallActive ? (
          <>
            <div className={styles.activeLayout}>
              <div className={styles.videoArea}>
                <VideoGrid />
              </div>
              <div className={styles.sidebar}>
                <ParticipantList />
                {isChatOpen && <ChatDuringCall />}
              </div>
            </div>
            <CallControls
              onChatToggle={() => setIsChatOpen(!isChatOpen)}
              onEndCall={() => setIsCallActive(false)}
            />
          </>
        ) : (
          <div className={styles.center}>
            <h2 className={styles.title}>Call Ended</h2>
            <button
              onClick={() => setIsCallActive(true)}
              className={`${styles.button} ${styles.primary}`}
              type="button"
            >
              Rejoin Call
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentVideoCall;
