// PermissionsGate.js

import React from 'react';
import { PERMISSIONS } from './permission-maps';

const PermissionsGate = ({ userRole, requiredPermissions, children }) => {
  const userPermissions = PERMISSIONS[userRole] || [];

  const hasPermission = requiredPermissions.every(permission =>
    userPermissions.includes(permission)
  );

  return hasPermission ? <>{children}</> : null;
};

export default PermissionsGate;
