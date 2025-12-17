import styles from "./CallManager.module.scss";

const CallManager = ({ chat }) => {
  return (
    <div className={styles.container}>
      <button className={`${styles.button} ${styles.audio}`} type="button">
        Audio Call
      </button>
      <button className={`${styles.button} ${styles.video}`} type="button">
        Video Call
      </button>
    </div>
  );
};

export default CallManager;
