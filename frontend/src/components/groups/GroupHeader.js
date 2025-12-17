import { useRouter } from 'next/router';
import groupService from '@/services/groupService';
import styles from "./GroupHeader.module.scss";

export default function GroupHeader({ group }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this group?')) {
      await groupService.deleteGroup(group.id);
      router.push('/groups');
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
      await groupService.leaveGroup(group.id);
      router.push('/groups');
    }
  };

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{group.name}</h1>
      <p className={styles.description}>{group.description}</p>
      <p className={styles.meta}>
        {group.isPublic ? 'Public Group' : 'Private Group'}
      </p>

      <div className={styles.actions}>
        {group.creatorId === 1 ? (
          <button
            onClick={handleDelete}
            className={`${styles.button} ${styles.danger}`}
          >
            Delete Group
          </button>
        ) : (
          <button
            onClick={handleLeave}
            className={`${styles.button} ${styles.warning}`}
          >
            Leave Group
          </button>
        )}
      </div>
    </div>
  );
}
