// src/hooks/withAuthProtection.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { isTokenExpired } from "@/utils/auth/tokenUtils";

export default function withAuthProtection(Component, rolesOrOptions = []) {
  const { roles: allowedRoles = [], permissions: allowedPerms = [] } =
    Array.isArray(rolesOrOptions)
      ? { roles: rolesOrOptions }
      : rolesOrOptions || {};

  return function ProtectedPage(props) {
    const { user, accessToken, logout } = useAuthStore();
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);
    const normalizedRoles = useMemo(
      () => allowedRoles.map((role) => role.toLowerCase()),
      [allowedRoles]
    );

    useEffect(() => {
      setHydrated(true);
    }, []);

    useEffect(() => {
      if (hydrated) {
        const role = user?.role?.toLowerCase();
        if (!user) {
          router.replace("/auth/login");
        } else if (!accessToken || isTokenExpired(accessToken)) {
          logout();
          router.replace("/auth/login");
        } else if (
          (normalizedRoles.length && !normalizedRoles.includes(role)) ||
          (allowedPerms.length &&
            role !== "superadmin" &&
            !allowedPerms.some((p) => user.permissions?.includes(p)))
        ) {
          router.replace("/error/403");
        }
      }
    }, [hydrated, user, accessToken, logout, router, normalizedRoles, allowedPerms]);

    const role = user?.role?.toLowerCase();
    if (
      !hydrated ||
      !user ||
      (normalizedRoles.length && !normalizedRoles.includes(role)) ||
      (allowedPerms.length &&
        role !== "superadmin" &&
        !allowedPerms.some((p) => user.permissions?.includes(p)))
    ) {
      return null;
    }

    return <Component {...props} />;
  };
}
