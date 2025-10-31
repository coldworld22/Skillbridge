import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import withAuthProtection from "@/hooks/withAuthProtection";
import usePermission from "@/hooks/usePermission";
import { PlusCircle, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18NextConfig from "../../../../../next-i18next.config.js";
import {
  fetchAllPermissions,
  createPermission,
  deletePermission,
} from "@/services/admin/roleService";

function PermissionsPage() {
  const { t } = useTranslation("dashboard");
  const [permissions, setPermissions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPermission, setNewPermission] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState(null);
  const { can, requirePermission } = usePermission();
  const canManage = can("manage_permissions");
  const permissionWarning = t("permissionsPage.no_permission", "You do not have permission to manage permissions.");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAllPermissions();
        setPermissions(data);
      } catch (err) {
        console.error(err);
        toast.error(t("permissionsPage.failed_to_load_permissions"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleAdd = async () => {
    if (!requirePermission("manage_permissions", permissionWarning)) {
      return;
    }
    if (!newPermission.trim()) {
      toast.error(t("permissionsPage.permission_name_required"));
      return;
    }
    if (permissions.some((p) => p.code === newPermission)) {
      toast.error(t("permissionsPage.permission_exists"));
      return;
    }
    try {
      const created = await createPermission({ code: newPermission });
      setPermissions([...permissions, created]);
      toast.success(t("permissionsPage.permission_added"));
    } catch (err) {
      console.error(err);
      toast.error(t("permissionsPage.permission_add_failed"));
    }
    setNewPermission("");
    setShowAddModal(false);
  };

  const openDeleteModal = (id) => {
    if (!requirePermission("manage_permissions", permissionWarning)) {
      return;
    }
    setPermissionToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!requirePermission("manage_permissions", permissionWarning)) {
      return;
    }
    if (!permissionToDelete) return;
    try {
      await deletePermission(permissionToDelete);
      setPermissions((perms) =>
        perms.filter((p) => p.id !== permissionToDelete)
      );
      toast.success(t("permissionsPage.permission_removed"));
    } catch (err) {
      console.error(err);
      toast.error(t("permissionsPage.permission_delete_failed"));
    }
    setPermissionToDelete(null);
    setShowDeleteModal(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setPermissionToDelete(null);
    toast(t("permissionsPage.deletion_cancelled"));
  };

  return (
    <AdminLayout>
      <div className="p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {t("permissionsPage.title")}
          </h1>
          {canManage && (
            <button
              className="inline-flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600 transition px-4 py-2 rounded-lg shadow-sm"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle className="w-5 h-5" />
              {t("permissionsPage.add_permission")}
            </button>
          )}
        </div>

        <div className="overflow-x-auto bg-white rounded-xl shadow border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold">
                  {t("permissionsPage.permission")}
                </th>
                {canManage && (
                  <th className="px-6 py-3 text-right font-semibold">
                    {t("permissionsPage.actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y text-gray-800">
              {permissions.map((perm) => (
                <tr key={perm.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-3 capitalize">
                    {perm.code.replace(/_/g, " ")}
                  </td>
                  {canManage && (
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => openDeleteModal(perm.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title={t("permissionsPage.delete")}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {permissions.length === 0 && !loading && (
                <tr>
                  <td
                    className="px-6 py-4 text-center text-gray-500"
                    colSpan={canManage ? 2 : 1}
                  >
                    {t("permissionsPage.no_permissions")}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    className="px-6 py-4 text-center text-gray-500"
                    colSpan={canManage ? 2 : 1}
                  >
                    {t("permissionsPage.loading")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add Modal */}
        {showAddModal && canManage && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                {t("permissionsPage.add_new_permission")}
              </h3>
              <input
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value)}
                placeholder={t("permissionsPage.placeholder")}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-yellow-500 focus:outline-none mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                >
                  {t("permissionsPage.cancel")}
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                >
                  {t("permissionsPage.add")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && canManage && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                {t("permissionsPage.confirm_deletion")}
              </h3>
              <p className="mb-6 text-gray-700">
                {t("permissionsPage.delete_question")}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                >
                  {t("permissionsPage.cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  {t("permissionsPage.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuthProtection(PermissionsPage, {
  permissions: ["view_permissions"],
});

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale,
        ["dashboard"],
        nextI18NextConfig
      )),
    },
  };
}
