import styles from "./PublicGroupJoin.module.scss";

export default function PublicGroupJoin({ group, onJoin, onView }) {
  if (!group) return null;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{group.name}</h3>
      <p className={styles.description}>{group.description}</p>
      {group.tags?.length ? (
        <p className={styles.tagline}>{group.tags.join(", ")}</p>
      ) : null}
      <div className={styles.actions}>
        {onJoin && (
          <button className={`${styles.button} ${styles.primary}`} onClick={onJoin}>
            Join Group
          </button>
        )}
        {onView && (
          <button className={`${styles.button} ${styles.secondary}`} onClick={onView}>
            View Details
          </button>
        )}
      </div>
    </div>
  );
}
