import { useState } from "react";
import ChatImage from "../shared/ChatImage";
import styles from "./GroupMembersManager.module.scss";

const initialMembers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Omar Saleh',
    avatar: 'https://i.pravatar.cc/150?img=2',
    role: 'moderator',
  },
  {
    id: '3',
    name: 'Lina Farah',
    avatar: 'https://i.pravatar.cc/150?img=3',
    role: 'member',
  },
];

const roleOptions = ['admin', 'moderator', 'member'];

export default function GroupMembersManager() {
  const [members, setMembers] = useState(initialMembers);

  const handleRoleChange = (id, newRole) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  };

  const handleRemove = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>👥 Manage Group Members</h3>
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
              <p className={styles.role}>{member.role}</p>
            </div>
          </div>

          <div className={styles.actions}>
            <select
              value={member.role}
              onChange={(e) => handleRoleChange(member.id, e.target.value)}
              className={styles.select}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>

            {member.role !== 'admin' && (
              <button
                onClick={() => handleRemove(member.id)}
                className={styles.remove}
                type="button"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
