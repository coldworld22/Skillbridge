import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { PlusCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAllPermissions,
  createPermission,
  deletePermission,
} from "@/services/admin/roleService";

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPermission, setNewPermission] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAllPermissions();
        setPermissions(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load permissions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async () => {
    if (!newPermission.trim()) return;
    if (permissions.some((p) => p.code === newPermission)) return;
    try {
      const created = await createPermission({ code: newPermission });
      setPermissions([...permissions, created]);
      toast.success("Permission added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add permission");
    }
    setNewPermission("");
    setShowAddModal(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this permission?")) return;
    try {
      await deletePermission(id);
      setPermissions((perms) => perms.filter((p) => p.id !== id));
      toast.success("Permission removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete");
    }
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

        <div className="overflow-x-auto rounded-xl shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Permission</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {permissions.map((perm) => (
                <tr key={perm.id} className="bg-white hover:bg-gray-50">
                  <td className="px-4 py-2 capitalize">
                    {perm.code.replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Trash2
                      className="w-4 h-4 text-red-600 cursor-pointer"
                      onClick={() => handleDelete(perm.id)}
                    />
                  </td>
                </tr>
              ))}
              {permissions.length === 0 && !loading && (
                <tr>
                  <td className="px-4 py-3 text-center" colSpan="2">
                    No permissions found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-4 py-3 text-center" colSpan="2">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
