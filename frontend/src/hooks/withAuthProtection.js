// src/hooks/withAuthProtection.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { isTokenExpired } from "@/utils/auth/tokenUtils";
import { getNormalizedRoles } from "@/utils/auth/roleUtils";

const normalizePermission = (permission) => {
  if (typeof permission !== "string") {
    return "";
  }

  return permission.trim().toLowerCase();
};

const buildNormalizedPermissionSet = (permissions) => {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return new Set();
  }

  return new Set(
    permissions
      .map(normalizePermission)
      .filter((permission) => permission.length > 0)
  );
};

export default function withAuthProtection(Component, rolesOrOptions = []) {
  const { roles: allowedRoles = [], permissions: allowedPerms = [] } =
    Array.isArray(rolesOrOptions)
      ? { roles: rolesOrOptions }
      : rolesOrOptions || {};

  return function ProtectedPage(props) {
    const { user, accessToken, logout, hasHydrated } = useAuthStore();
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);
    const isRedirectingRef = useRef(false);
    const logoutInProgressRef = useRef(false);

    const normalizedAllowedPerms = useMemo(
      () =>
        allowedPerms
          .map(normalizePermission)
          .filter((permission) => permission.length > 0),
      [allowedPerms]
    );

    const normalizedUserPerms = useMemo(
      () => buildNormalizedPermissionSet(user?.permissions),
      [user?.permissions]
    );

    useEffect(() => {
      setHydrated(true);
    }, []);

    useEffect(() => {
      const handleRouteChangeFinished = () => {
        isRedirectingRef.current = false;
      };

      if (!router?.events) {
        return () => {};
      }

      router.events.on("routeChangeComplete", handleRouteChangeFinished);
      router.events.on("routeChangeError", handleRouteChangeFinished);

      return () => {
        router.events.off("routeChangeComplete", handleRouteChangeFinished);
        router.events.off("routeChangeError", handleRouteChangeFinished);
      };
    }, [router]);

    useEffect(() => {
      if (!hydrated || !hasHydrated) {
        return;
      }

      const attemptRedirect = (path) => {
        if (isRedirectingRef.current || router.asPath === path) {
          return;
        }

        isRedirectingRef.current = true;
        router.replace(path);
      };

      const normalizedRoles = getNormalizedRoles(user);
      const lacksRequiredPermissions =
        normalizedAllowedPerms.length > 0 &&
        !normalizedRoles.includes("superadmin") &&
        !normalizedAllowedPerms.some((permission) =>
          normalizedUserPerms.has(permission)
        );
      if (!user) {
        logoutInProgressRef.current = false;
        attemptRedirect("/auth/login");
      } else if (!accessToken || isTokenExpired(accessToken)) {
        if (!logoutInProgressRef.current) {
          logoutInProgressRef.current = true;
          Promise.resolve(logout())
            .catch(() => {
              // ignore errors from logout, we'll still redirect below
            })
            .finally(() => {
              logoutInProgressRef.current = false;
            });
        }
        attemptRedirect("/auth/login");
      } else if (
        (allowedRoles.length &&
          !allowedRoles.some((allowedRole) =>
            normalizedRoles.includes(allowedRole)
          )) ||
        lacksRequiredPermissions
      ) {
        attemptRedirect("/error/403");
      }
    }, [
      hydrated,
      hasHydrated,
      user,
      accessToken,
      logout,
      router,
      router.asPath,
      allowedRoles,
      normalizedAllowedPerms,
      normalizedUserPerms,
    ]);

    const normalizedRoles = getNormalizedRoles(user);
    const hasAllowedRole =
      !allowedRoles.length ||
      allowedRoles.some((allowedRole) => normalizedRoles.includes(allowedRole));
    const lacksRequiredPermissions =
      normalizedAllowedPerms.length > 0 &&
      !normalizedRoles.includes("superadmin") &&
      !normalizedAllowedPerms.some((permission) =>
        normalizedUserPerms.has(permission)
      );
    if (
      !hydrated ||
      !hasHydrated ||
      !user ||
      !hasAllowedRole ||
      lacksRequiredPermissions
    ) {
      return null;
    }

    return <Component {...props} />;
  };
}
