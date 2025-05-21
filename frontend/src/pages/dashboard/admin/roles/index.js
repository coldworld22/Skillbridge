import React, { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import RoleManagement from "@/components/admin/roles/RoleManagement";

export default function RolesPermissionsPage() {
  const [editingRules, setEditingRules] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const handleEditRules = (role) => {
    setSelectedRole(role);
    setEditingRules(true);
  };

  const handleCloseModal = () => {
    setEditingRules(false);
    setSelectedRole(null);
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Roles & Permissions Management</h1>

        <RoleManagement onEditRules={handleEditRules} />

        {editingRules && selectedRole && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-semibold mb-4">Edit Rules for {selectedRole.name}</h2>
              {/* Modal form content goes here */}
              <form>
                <textarea
                  className="w-full h-40 p-3 border rounded-md mb-4"
                  placeholder="Enter rules or permissions as JSON, comma-separated, etc."
                ></textarea>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}