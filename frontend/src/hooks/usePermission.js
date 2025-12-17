import { useCallback } from "react";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";

const normalize = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const normalizeRoles = (user) => {
  if (!user) return [];
  if (Array.isArray(user.roles)) return user.roles;
  if (user.role) return [user.role];
  return [];
};

export default function usePermission() {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions || [];
  const isSuperAdmin = normalizeRoles(user).some(
    (role) => role && role.toLowerCase() === "superadmin"
  );

  const can = useCallback(
    (required) => {
      const list = normalize(required);
      if (!list.length) return true;
      if (isSuperAdmin) return true;
      return list.some((perm) => permissions.includes(perm));
    },
    [permissions, isSuperAdmin]
  );

  const requirePermission = useCallback(
    (required, message) => {
      const allowed = can(required);
      if (!allowed) {
        toast.error(message || "You do not have permission to perform this action.");
      }
      return allowed;
    },
    [can]
  );

  const withPermission = useCallback(
    (required, fn, message) => {
      if (!requirePermission(required, message)) return;
      if (typeof fn === "function") {
        return fn();
      }
      return undefined;
    },
    [requirePermission]
  );

  return {
    can,
    requirePermission,
    withPermission,
    permissions,
    user,
    isSuperAdmin,
  };
}

