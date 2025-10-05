import React from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import RoleManagement from "@/components/admin/roles/RoleManagement";
import withAuthProtection from "@/hooks/withAuthProtection";

function RolesPage() {
  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Roles Management</h1>

        <RoleManagement />
      </div>
    </AdminLayout>
  );
}

export default withAuthProtection(RolesPage, {
  permissions: ["view_roles", "view_permissions"],
});
