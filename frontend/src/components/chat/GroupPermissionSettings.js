// GroupPermissionSettings.js

import React from 'react';
import PermissionsGate from './PermissionsGate';
import { ROLES } from './permission-maps';
import PendingJoinRequests from './PendingJoinRequests';
import GroupMembersManager from './GroupMembersManager';
import GroupSettingsForm from './GroupSettingsForm';
import RolePermissionMatrix from './RolePermissionMatrix';
import DangerZone from './DangerZone';
import { toast } from 'react-toastify';

const GroupPermissionSettings = ({ userRole, onPermissionChange }) => {
  return (
    <div className="group-permission-settings space-y-8">
      <h2 className="text-2xl font-bold mb-4">🛠️ Group Management Panel</h2>

      {/* Permissions Toggles */}
      <div className="space-y-2 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Permission Shortcuts</h3>
        <PermissionsGate userRole={userRole} requiredPermissions={['manage_members']}>
          <label className="flex items-center gap-2">
            <input type="checkbox" onChange={() => onPermissionChange('canInviteMembers')} />
            <span>Can Invite Members</span>
          </label>
        </PermissionsGate>

        <PermissionsGate userRole={userRole} requiredPermissions={['edit_settings']}>
          <label className="flex items-center gap-2">
            <input type="checkbox" onChange={() => onPermissionChange('canEditGroupInfo')} />
            <span>Can Edit Group Info</span>
          </label>
        </PermissionsGate>

        <PermissionsGate userRole={userRole} requiredPermissions={['delete_group']}>
          <button
            onClick={() => onPermissionChange('deleteGroup')}
            className="mt-2 text-sm text-red-500 underline"
          >
            Delete Group
          </button>
        </PermissionsGate>
      </div>

      {/* Editable Group Info */}
      <div className="bg-white p-4 rounded shadow">
        <GroupSettingsForm
          initialSettings={{
            name: 'Frontend Wizards',
            description: 'React, Vue, and modern UI lovers',
            tags: ['React', 'Tailwind'],
            isPublic: true,
          }}
          onSave={(data) => toast.success('Group settings updated')}
        />
      </div>

      {/* Join Requests */}
      <div className="bg-white p-4 rounded shadow">
        <PendingJoinRequests
          onApprove={(id) => toast.success(`Approved: ${id}`)}
          onReject={(id) => toast.info(`Rejected: ${id}`)}
        />
      </div>

      {/* Members and Role Management */}
      <div className="bg-white p-4 rounded shadow">
        <GroupMembersManager />
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white p-4 rounded shadow">
        <RolePermissionMatrix
          onChange={(newMatrix) => toast.success('Updated permissions')}
        />
      </div>

      {/* Danger Zone */}
      <div className="bg-white p-4 rounded shadow">
        <DangerZone
          onDelete={() => toast.error('Group deleted')}
          onTransfer={() => toast.info('Ownership transferred')}
        />
      </div>
    </div>
  );
};

export default GroupPermissionSettings;
