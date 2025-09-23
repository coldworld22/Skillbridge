// src/hooks/withAuthProtection.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { isTokenExpired } from "@/utils/auth/tokenUtils";
import { getNormalizedRoles } from "@/utils/auth/roleUtils";

export default function withAuthProtection(Component, rolesOrOptions = []) {
  const { roles: allowedRoles = [], permissions: allowedPerms = [] } =
    Array.isArray(rolesOrOptions)
      ? { roles: rolesOrOptions }
      : rolesOrOptions || {};

  return function ProtectedPage(props) {
    const { user, accessToken, logout, hasHydrated } = useAuthStore();
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
      setHydrated(true);
    }, []);

    useEffect(() => {
      if (!hydrated || !hasHydrated) {
        return;
      }

      const normalizedRoles = getNormalizedRoles(user);
      if (!user) {
        router.replace("/auth/login");
      } else if (!accessToken || isTokenExpired(accessToken)) {
        logout();
        router.replace("/auth/login");
      } else if (
        (allowedRoles.length &&
          !allowedRoles.some((allowedRole) =>
            normalizedRoles.includes(allowedRole)
          )) ||
        (allowedPerms.length &&
          !normalizedRoles.includes("superadmin") &&
          !allowedPerms.some((p) => user.permissions?.includes(p)))
      ) {
        router.replace("/error/403");
      }
    }, [
      hydrated,
      hasHydrated,
      user,
      accessToken,
      logout,
      router,
    ]);

    const normalizedRoles = getNormalizedRoles(user);
    const hasAllowedRole =
      !allowedRoles.length ||
      allowedRoles.some((allowedRole) => normalizedRoles.includes(allowedRole));
    const hasRequiredPerms =
      !allowedPerms.length ||
      normalizedRoles.includes("superadmin") ||
      allowedPerms.some((p) => user?.permissions?.includes(p));
    if (
      !hydrated ||
      !hasHydrated ||
      !user ||
      !hasAllowedRole ||
      !hasRequiredPerms
    ) {
      return null;
    }

    return <Component {...props} />;
  };
}
