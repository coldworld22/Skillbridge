import { useEffect, useRef } from "react";
import styles from "./VideoGrid.module.scss";

const LocalVideo = ({ stream }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  if (!stream) return null;
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={styles.video}
    />
  );
};

const PeerVideo = ({ peer }) => {
  const ref = useRef();
  useEffect(() => {
    peer.on("stream", (stream) => {
      if (ref.current) ref.current.srcObject = stream;
    });
  }, [peer]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      className={styles.video}
    />
  );
};

export default function VideoGrid({ localStream, peers }) {
  return (
    <div className={styles.grid}>
      <div className={styles.tile}>
        <LocalVideo stream={localStream} />
      </div>
      {peers.map(({ peerID, peer }) => (
        <div
          key={peerID}
          className={styles.tile}
        >
          <PeerVideo peer={peer} />
        </div>
      ))}
    </div>
  );
}
