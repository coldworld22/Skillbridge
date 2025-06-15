import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  fetchAllPermissions,
  createPermission,
  deletePermission,
} from "@/services/admin/roleService";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPermission, setNewPermission] = useState("");

  useEffect(() => {
    fetchAllPermissions().then(setPermissions);
  }, []);

  const handleAdd = async () => {
    if (!newPermission.trim()) return;
    if (permissions.some((p) => p.code === newPermission)) return;
    const created = await createPermission({ code: newPermission });
    setPermissions([...permissions, created]);
    setNewPermission("");
    setShowAddModal(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this permission?")) return;
    await deletePermission(id);
    setPermissions((perms) => perms.filter((p) => p.id !== id));
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Permissions</h1>

        <button
          className="flex items-center mb-4 bg-yellow-100 hover:bg-yellow-200 rounded-xl py-2 px-4"
          onClick={() => setShowAddModal(true)}
        >
          <PlusCircle className="w-5 h-5 mr-2 text-yellow-600" />
          Add Permission
        </button>

        <ul className="space-y-2">
          {permissions.map((perm) => (
            <li
              key={perm.id}
              className="p-3 border rounded-xl bg-white capitalize flex justify-between items-center"
            >
              {perm.code.replace(/_/g, " ")}
              <Trash2
                className="w-4 h-4 text-red-600 cursor-pointer"
                onClick={() => handleDelete(perm.id)}
              />
            </li>
          ))}
        </ul>

        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Add New Permission</h3>
              <input
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value)}
                placeholder="e.g. manage_users"
                className="w-full border p-2 rounded mb-4"
              />
              <div className="flex justify-end gap-4">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                  onClick={handleAdd}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
