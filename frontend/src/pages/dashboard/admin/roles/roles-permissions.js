import React from "react";
import AdminLayout from "@/components/layouts/AdminLayout"; // if available
import RoleManagement from "@/components/admin/roles/RoleManagement";

export default function RolesPermissionsPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Roles & Permissions Management</h1>
        <RoleManagement />
      </div>
    </AdminLayout>
  );
}
