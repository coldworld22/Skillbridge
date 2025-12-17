// components/groups/GroupPermissionSettings.js

import { useEffect, useState } from 'react';
import groupService from '@/services/groupService';
import styles from "./GroupPermissionSettings.module.scss";

export default function GroupPermissionSettings({ groupId }) {
  const [permissions, setPermissions] = useState(null);
  const [saving, setSaving] = useState(false);

  const roles = ['admin', 'moderator', 'member'];
  const actions = ['message', 'upload', 'video', 'invite'];

  useEffect(() => {
    groupService.getGroupPermissions(groupId).then(setPermissions);
  }, [groupId]);

  const togglePermission = (role, action) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [action]: !prev[role][action],
      },
    }));
  };

  const savePermissions = async () => {
    setSaving(true);
    await groupService.updateGroupPermissions(groupId, permissions);
    setSaving(false);
  };

  if (!permissions) {
    return <p className={styles.muted}>Loading permissions...</p>;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🔒 Group Permissions</h3>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={styles.th}>Role</th>
            {actions.map((action) => (
              <th key={action} className={styles.th}>
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role} className={styles.row}>
              <td className={`${styles.td} ${styles.role}`}>{role}</td>
              {actions.map((action) => (
                <td key={action} className={`${styles.td} ${styles.checkboxCell}`}>
                  <input
                    type="checkbox"
                    checked={permissions[role]?.[action] || false}
                    onChange={() => togglePermission(role, action)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={savePermissions}
        disabled={saving}
        className={styles.button}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
