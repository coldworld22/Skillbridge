// components/groups/GroupPermissionSettings.js

import { useEffect, useState } from 'react';
import groupService from '@/services/groupService';

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
    return <p className="text-sm text-gray-500 mt-4">Loading permissions...</p>;
  }

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-md font-semibold mb-2">🔒 Group Permissions</h3>
      <table className="w-full text-sm border rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Role</th>
            {actions.map((action) => (
              <th key={action} className="p-2 capitalize">{action}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role} className="border-t">
              <td className="p-2 font-medium capitalize">{role}</td>
              {actions.map((action) => (
                <td key={action} className="p-2 text-center">
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
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
