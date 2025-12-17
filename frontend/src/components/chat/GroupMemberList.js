import React, { useEffect, useState } from "react";
import ChatImage from "../shared/ChatImage";
import groupService from "@/services/groupService";
import styles from "./GroupMemberList.module.scss";

const roleStyles = {
  admin: styles.admin,
  member: styles.member,
  pending: styles.pending,
};

export default function GroupMembersList({ groupId }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!groupId) return;
    let isMounted = true;
    groupService
      .getGroupMembers(groupId)
      .then((data) => {
        if (isMounted) setMembers(data);
      })
      .catch(() => isMounted && setError('Failed to load members'))
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [groupId]);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.container}>
      {members.map((member) => (
        <div
          key={member.id}
          className={styles.card}
        >
          <div className={styles.profile}>
            <ChatImage
              src={member.avatar}
              alt={member.name}
              className={styles.avatar}
              width={40}
              height={40}
            />
            <div>
              <p className={styles.name}>{member.name}</p>
              <span
                className={`${styles.role} ${roleStyles[member.role] || ""}`}
              >
                {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
              </span>
            </div>
          </div>

          {member.role === 'pending' && (
            <div className={styles.actions}>
              <button className={`${styles.actionButton} ${styles.approve}`} type="button">Approve</button>
              <button className={`${styles.actionButton} ${styles.reject}`} type="button">Reject</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
