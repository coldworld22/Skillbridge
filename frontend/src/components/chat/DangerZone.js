import styles from "./DangerZone.module.scss";

export default function DangerZone({ onDelete, onTransfer }) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>☠️ Danger Zone</h3>

      <div className={`${styles.card} ${styles.danger}`}>
        <p className={styles.text}>
          Deleting the group is permanent and cannot be undone.
        </p>
        <button
          onClick={onDelete}
          className={`${styles.button} ${styles.delete}`}
          type="button"
        >
          Delete Group
        </button>
      </div>

      <div className={`${styles.card} ${styles.warn}`}>
        <p className={styles.text}>
          You can transfer group ownership to another admin.
        </p>
        <button
          onClick={onTransfer}
          className={`${styles.button} ${styles.transfer}`}
          type="button"
        >
          Transfer Ownership
        </button>
      </div>
    </div>
  );
}
