import React from "react";
import RoleManagement from "@/components/admin/roleManagement";

export default function RolesPermissionsPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Roles & Permissions Management</h2>
      <RoleManagement />
    </div>
  );
}
