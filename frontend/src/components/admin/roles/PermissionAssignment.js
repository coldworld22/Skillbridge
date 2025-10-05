import React, { useEffect, useState } from "react";
import { CheckCircle, CheckSquare, PlusCircle } from "lucide-react";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";
import { getNormalizedRoles } from "@/utils/auth/roleUtils";
import {
  fetchAllPermissions,
  updateRolePermissions,
  fetchRoleById,
  createPermission,
} from "@/services/admin/roleService";

export default function PermissionAssignment({
  role,
  canManage,
  onRolePermissionsUpdated,
}) {
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [catalogueUnavailable, setCatalogueUnavailable] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPermission, setNewPermission] = useState("");
  const { user } = useAuthStore();
  const normalizedRoles = getNormalizedRoles(user);
  const hasAdminRole = normalizedRoles.some((role) =>
    ["admin", "superadmin"].includes(role)
  );
  const canAddPermission =
    hasAdminRole || user?.permissions?.includes("manage_permissions");
  const canViewPermissions =
    hasAdminRole || user?.permissions?.includes("view_permissions");

  useEffect(() => {
    const loadPermissions = async () => {
      if (!canViewPermissions) {
        setPermissions([]);
        return;
      }
      try {
        const all = await fetchAllPermissions();
        if (!all?.length) {
          setPermissions([]);
          setCatalogueUnavailable(true);
          toast.error("Failed to load permissions catalogue");
          return;
        }
        setPermissions(all);
        setCatalogueUnavailable(false);
      } catch (err) {
        setPermissions([]);
        setCatalogueUnavailable(true);
        toast.error("Failed to load permissions catalogue");
      }
    };
    loadPermissions();
  }, [canViewPermissions]);

  useEffect(() => {
    if (!canViewPermissions) {
      setShowAddModal(false);
    }
  }, [canViewPermissions]);

  useEffect(() => {
    if (role) {
      const loadRole = async () => {
        try {
          const r = await fetchRoleById(role.id);
          setAssignedPermissions(r.permissions || []);
        } catch (err) {
          toast.error("Failed to load role");
        }
      };
      loadRole();
    }
  }, [role]);

  const handleTogglePermission = (code) => {
    if (!canManage || !canViewPermissions) return;
    setAssignedPermissions((current) =>
      current.includes(code)
        ? current.filter((p) => p !== code)
        : [...current, code]
    );
  };

  const handleCheckAll = () => {
    if (!canManage || !canViewPermissions) return;
    setAssignedPermissions((prev) =>
      prev.length === permissions.length
        ? []
        : permissions.map((p) => p.code)
    );
  };

  const handleAddNewPermission = async () => {
    if (!canAddPermission) return;
    const code = newPermission.trim();
    if (!code) {
      toast.error("Permission code cannot be empty");
      return;
    }

    const normalisedCode = code.toLowerCase();
    if (
      permissions.some(
        (p) => typeof p.code === "string" && p.code.toLowerCase() === normalisedCode
      )
    ) {
      toast.error("Permission already exists");
      return;
    }
    try {
      const created = await createPermission({ code });
      const createdCode =
        typeof created?.code === "string" ? created.code.trim() : code;
      const createdPermission = { ...created, code: createdCode };
      setPermissions([...permissions, createdPermission]);
      setAssignedPermissions([...assignedPermissions, createdCode]);
      setNewPermission("");
      setShowAddModal(false);
      toast.success("Permission created");
    } catch (err) {
      toast.error("Failed to create permission");
    }
  };

  const handleSave = async () => {
    if (!canManage || !canViewPermissions) return;
    const ids = assignedPermissions
      .map((code) => permissions.find((p) => p.code === code)?.id)
      .filter(Boolean);
    try {
      const updatedRole = await updateRolePermissions(role.id, ids);
      const updatedPermissions = updatedRole?.permissions ?? [];
      setAssignedPermissions(updatedPermissions);
      if (onRolePermissionsUpdated) {
        onRolePermissionsUpdated(updatedRole);
      }

      const backendAdded = updatedPermissions.filter(
        (code) => !requestedCodes.includes(code)
      );

      if (backendAdded.length) {
        toast.success(
          `Permissions saved. Additional permissions applied by the system: ${backendAdded.join(
            ", "
          )}`
        );
      } else {
        toast.success("Permissions saved");
      }
    } catch (err) {
      toast.error("Failed to save permissions");
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          <CheckCircle className="mr-2 text-yellow-500" />
          Permissions for <span className="ml-2 text-blue-500">{role.name}</span>
        </h3>
        <div className="flex gap-2">
          {canManage && canViewPermissions && (
            <button
              className="flex items-center text-sm bg-gray-100 hover:bg-gray-200 rounded-xl py-2 px-4"
              onClick={handleCheckAll}
            >
              <CheckSquare className="w-5 h-5 mr-2 text-blue-500" />
              {assignedPermissions.length === permissions.length ? "Uncheck All" : "Check All"}
            </button>
          )}
          {canAddPermission && canViewPermissions && (
            <button
              className="flex items-center text-sm bg-yellow-100 hover:bg-yellow-200 rounded-xl py-2 px-4"
              onClick={() => setShowAddModal(true)}
            >
              <PlusCircle className="w-5 h-5 mr-2 text-yellow-600" />
              Add Permission
            </button>
          )}
        </div>
      </div>

      {!canViewPermissions ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700">
          Additional permission required to view available permissions.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {permissions.map((perm) => (
            <label
              key={perm.id || perm.code}
              className={`flex items-center p-3 border rounded-xl cursor-pointer transition ${
                assignedPermissions.includes(perm.code)
                  ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                  : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={assignedPermissions.includes(perm.code)}
                onChange={() => handleTogglePermission(perm.code)}
                className="mr-3 accent-yellow-500"
                disabled={!canManage}
              />
              <span className="capitalize">{perm.code.replace(/_/g, " ")}</span>
            </label>
          ))}
        </div>
      )}

      {catalogueUnavailable && (
        <p className="mt-4 text-sm text-gray-500">
          Saving changes is disabled until the permissions catalogue can be retrieved.
        </p>
      )}

      {canManage && (
        <button
          className="mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:to-yellow-700 text-white px-6 py-2 rounded-xl shadow transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={!canViewPermissions}
        >
          Save Changes
        </button>
      )}

      {showAddModal && canAddPermission && canViewPermissions && (
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
                onClick={handleAddNewPermission}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
