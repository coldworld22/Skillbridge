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
      <div className="p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Permissions</h1>
          <button
            className="inline-flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600 transition px-4 py-2 rounded-lg shadow-sm"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle className="w-5 h-5" />
            Add Permission
          </button>
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold">Permission</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-800">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 capitalize">
                    {perm.code.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => handleDelete(perm.id)}
                      className="text-red-600 hover:text-red-800 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {permissions.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-4 text-center text-gray-500" colSpan="2">
                    No permissions found
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-6 py-4 text-center text-gray-500" colSpan="2">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-gray-800">Add New Permission</h3>
              <input
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value)}
                placeholder="e.g. manage_users"
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-yellow-500 focus:outline-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
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
