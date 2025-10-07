// src/hooks/withAuthProtection.js
import { useEffect, useRef, useState } from "react";
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
    const isRedirectingRef = useRef(false);
    const logoutInProgressRef = useRef(false);

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
        (allowedPerms.length &&
          !normalizedRoles.includes("superadmin") &&
          !allowedPerms.some((p) => user.permissions?.includes(p)))
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
      allowedPerms,
    ]);

    const normalizedRoles = getNormalizedRoles(user);
    const hasAllowedRole =
      !allowedRoles.length ||
      allowedRoles.some((allowedRole) => normalizedRoles.includes(allowedRole));
    const hasRequiredPerms =
      !allowedPerms.length ||
      normalizedRoles.includes("superadmin") ||
      allowedPerms.some((p) => user?.permissions?.includes(p));
    if (!hydrated || !hasHydrated || isRedirectingRef.current) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="flex flex-col items-center gap-3 text-gray-600">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
            <span className="text-sm font-medium">Loading dashboard…</span>
          </div>
        </div>
      );
    }

    if (!user || !hasAllowedRole || !hasRequiredPerms) {
      return null;
    }

    return <Component {...props} />;
  };
}
