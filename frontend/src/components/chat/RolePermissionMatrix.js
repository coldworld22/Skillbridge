import { useState } from 'react';

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
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">🔐 Role Permissions</h3>
      <div className="overflow-x-auto">
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Permission</th>
              <th className="text-center p-2">Admin</th>
              <th className="text-center p-2">Moderator</th>
              <th className="text-center p-2">Member</th>
            </tr>
          </thead>
          <tbody>
            {allPermissions.map(({ key, label }) => (
              <tr key={key} className="border-t">
                <td className="p-2">{label}</td>
                {['admin', 'moderator', 'member'].map((role) => (
                  <td key={role} className="text-center">
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
