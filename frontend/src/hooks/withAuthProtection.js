// src/hooks/withAuthProtection.js
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { isTokenExpired } from "@/utils/auth/tokenUtils";

export default function withAuthProtection(Component, rolesOrOptions = []) {
  const { roles: allowedRoles = [], permissions: allowedPerms = [] } =
    Array.isArray(rolesOrOptions)
      ? { roles: rolesOrOptions }
      : rolesOrOptions || {};

  return function ProtectedPage(props) {
    const { user, accessToken, logout } = useAuthStore((state) => ({
      user: state.user,
      accessToken: state.accessToken,
      logout: state.logout,
    }));
    if (typeof window !== "undefined") {
      // Debug render frequency to trace potential infinite loops
      console.count(
        `withAuthProtection render (${Component.displayName || Component.name || "Anonymous"})`
      );
    }
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);
    const normalizedRoles = useMemo(
      () => allowedRoles.map((role) => role.toLowerCase()),
      [allowedRoles]
    );
    const redirectGuardRef = useRef(false);

    useEffect(() => {
      setHydrated(true);
    }, []);

    useEffect(() => {
      if (!hydrated || redirectGuardRef.current) return;
      if (typeof window !== "undefined") {
        console.log("[withAuthProtection] effect", {
          page: Component.displayName || Component.name || "Anonymous",
          hydrated,
          hasUser: Boolean(user),
          hasToken: Boolean(accessToken),
          redirectGuard: redirectGuardRef.current,
        });
      }

      const role = user?.role?.toLowerCase();
      const profilePaths = {
        admin: "/dashboard/admin/profile/edit",
        instructor: "/dashboard/instructor/profile/edit",
        student: "/dashboard/student/profile/edit",
        superadmin: "/dashboard/admin/profile/edit",
      };
      const profilePath = profilePaths[role] || "/profile/edit";
      const currentPath = router.pathname;
      const onProfileCompletionRoute = profilePath && currentPath.startsWith(profilePath);
      const onEmailVerificationRoute = currentPath.startsWith("/auth/verify-email");

      if (!user) {
        if (typeof window !== "undefined") {
          console.warn("[withAuthProtection] redirecting to login - no user");
        }
        redirectGuardRef.current = true;
        router.replace("/auth/login");
        return;
      }

      if (!accessToken || isTokenExpired(accessToken)) {
        if (typeof window !== "undefined") {
          console.warn("[withAuthProtection] redirecting to login - token missing/expired");
        }
        redirectGuardRef.current = true;
        logout();
        router.replace("/auth/login");
        return;
      }

      if (!user.profile_complete && !onProfileCompletionRoute) {
        if (typeof window !== "undefined") {
          console.warn("[withAuthProtection] redirecting to profile completion");
        }
        redirectGuardRef.current = true;
        router.replace(profilePath);
        return;
      }

      if (user.profile_complete && !user.is_email_verified && !onEmailVerificationRoute) {
        if (typeof window !== "undefined") {
          console.warn("[withAuthProtection] redirecting to email verification");
        }
        redirectGuardRef.current = true;
        router.replace("/auth/verify-email");
        return;
      }

      if (
        (normalizedRoles.length && !normalizedRoles.includes(role)) ||
        (allowedPerms.length &&
          role !== "superadmin" &&
          !allowedPerms.some((p) => user.permissions?.includes(p)))
      ) {
        if (typeof window !== "undefined") {
          console.warn("[withAuthProtection] redirecting to 403 - role/permissions mismatch");
        }
        redirectGuardRef.current = true;
        router.replace("/error/403");
      }
    }, [hydrated, user, accessToken, logout, router, allowedPerms, normalizedRoles]);

    const role = user?.role?.toLowerCase();
    const profilePaths = {
      admin: "/dashboard/admin/profile/edit",
      instructor: "/dashboard/instructor/profile/edit",
      student: "/dashboard/student/profile/edit",
      superadmin: "/dashboard/admin/profile/edit",
    };
    const profilePath = profilePaths[role] || "/profile/edit";
    const currentPath = router.pathname;
    const onProfileCompletionRoute = profilePath && currentPath.startsWith(profilePath);
    const onEmailVerificationRoute = currentPath.startsWith("/auth/verify-email");

    if (!hydrated || !user) {
      return null;
    }

    if (!user.profile_complete && !onProfileCompletionRoute) {
      return null;
    }

    if (user.profile_complete && !user.is_email_verified && !onEmailVerificationRoute) {
      return null;
    }

    if (
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
