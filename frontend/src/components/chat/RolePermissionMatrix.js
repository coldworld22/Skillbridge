import { useState } from "react";
import styles from "./RolePermissionMatrix.module.scss";

const defaultMatrix = {
  admin: ['manage_members', 'edit_settings', 'delete_group'],
  moderator: ['manage_members', 'edit_settings'],
  member: [],
};

const allPermissions = [
  { key: 'manage_members', label: 'Manage Members' },
  { key: 'edit_settings', label: 'Edit Settings' },
  { key: 'delete_group', label: 'Delete Group' },
];

export default function RolePermissionMatrix({ onChange }) {
  const [matrix, setMatrix] = useState(defaultMatrix);

  const togglePermission = (role, permission) => {
    setMatrix((prev) => {
      const current = new Set(prev[role]);
      current.has(permission) ? current.delete(permission) : current.add(permission);
      const updated = { ...prev, [role]: Array.from(current) };
      onChange?.(updated);
      return updated;
    });
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🔐 Role Permissions</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.headRow}>
              <th className={styles.headerCell}>Permission</th>
              <th className={`${styles.headerCell} ${styles.center}`}>Admin</th>
              <th className={`${styles.headerCell} ${styles.center}`}>Moderator</th>
              <th className={`${styles.headerCell} ${styles.center}`}>Member</th>
            </tr>
          </thead>
          <tbody>
            {allPermissions.map(({ key, label }) => (
              <tr key={key}>
                <td className={styles.cell}>{label}</td>
                {['admin', 'moderator', 'member'].map((role) => (
                  <td key={role} className={`${styles.cell} ${styles.center}`}>
                    <input
                      type="checkbox"
                      checked={matrix[role]?.includes(key)}
                      onChange={() => togglePermission(role, key)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
