import styles from "./AdminCommunity.module.scss";

export default function ContributorCard({ user }) {
  return (
    <div className={styles.card} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <img src={user.avatar || "/images/default-avatar.png"} className={styles.avatar} />
      <div>
        <h4 className={styles.title}>{user.name}</h4>
        <p className={styles.muted}>
          {user.contributions} contributions • {user.reputation} reputation
        </p>
      </div>
    </div>
  );
}
