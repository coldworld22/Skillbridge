import styles from "./CallOverlay.module.scss";

const CallOverlay = ({ incoming, name, onAccept, onDecline }) => {
  const safeName = name || "Someone";
  const label = incoming
    ? `${safeName} is calling...`
    : `Calling ${safeName}...`;

  return (
    <div className={styles.overlay}>
      <p>{label}</p>
      <div className={styles.buttons}>
        {incoming ? (
          <>
            <button onClick={onAccept} className={`${styles.button} ${styles.accept}`} type="button">
              ✅ Accept
            </button>
            <button onClick={onDecline} className={`${styles.button} ${styles.decline}`} type="button">
              ❌ Decline
            </button>
          </>
        ) : (
          <button onClick={onDecline} className={`${styles.button} ${styles.decline}`} type="button">
            ❌ Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default CallOverlay;
