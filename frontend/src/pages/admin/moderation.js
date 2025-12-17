// pages/admin/moderation.js
import AdminLayout from "@/components/layouts/AdminLayout";
import MessageFlagLog from "@/components/admin/security/MessageFlagLog";
import styles from "./admin.module.scss";

export default function ModerationPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>🛡️ Moderation Center</h1>
      <p className={styles.subtitle}>
        Review messages flagged for inappropriate language during live classes.
      </p>
      <div className={styles.card}>
        <MessageFlagLog />
      </div>
    </div>
  );
}

ModerationPage.getLayout = function getLayout(page) {
  return <AdminLayout>{page}</AdminLayout>;
};
