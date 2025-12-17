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
    const user = useAuthStore((state) => state.user);
    const accessToken = useAuthStore((state) => state.accessToken);
    const logout = useAuthStore((state) => state.logout);
    const hasHydrated = useAuthStore((state) => state.hasHydrated);
    const router = useRouter();
    const [hydrated, setHydrated] = useState(hasHydrated);
    const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());
    useEffect(() => {
      if (hasHydrated) {
        setHydrated(true);
      }
    }, [hasHydrated]);

    const redirectDecision = useMemo(() => {
      if (!hydrated) return null;

      const role = user?.role?.toLowerCase();
      const profilePaths = {
        admin: "/dashboard/admin/profile/edit",
        instructor: "/dashboard/instructor/profile/edit",
        student: "/dashboard/student/profile/edit",
        superadmin: "/dashboard/admin/profile/edit",
      };
      const profilePath = profilePaths[role];
      const currentPath = router.pathname;
      const onProfileCompletionRoute = profilePath ? currentPath.startsWith(profilePath) : false;
      const onEmailVerificationRoute = currentPath.startsWith("/auth/verify-email");

      if (!user) {
        return { destination: "/auth/login", logout: false };
      }

      if (!accessToken || isTokenExpired(accessToken)) {
        return { destination: "/auth/login", logout: true };
      }

      if (!user.profile_complete && profilePath && !onProfileCompletionRoute) {
        return { destination: profilePath, logout: false };
      }

      if (user.profile_complete && !user.is_email_verified && !onEmailVerificationRoute) {
        return { destination: "/auth/verify-email", logout: false };
      }

      if (
        (normalizedRoles.length && !normalizedRoles.includes(role)) ||
        (allowedPerms.length &&
          role !== "superadmin" &&
          !allowedPerms.some((p) => user.permissions?.includes(p)))
      ) {
        return { destination: "/error/403", logout: false };
      }

      return null;
    }, [hydrated, user, accessToken, normalizedRoles, router.pathname]);

    useEffect(() => {
      if (!redirectDecision) return;
      if (redirectDecision.logout) {
        logout();
      }
      router.replace(redirectDecision.destination);
    }, [redirectDecision, logout, router]);

    const role = user?.role?.toLowerCase();
    const profilePaths = {
      admin: "/dashboard/admin/profile/edit",
      instructor: "/dashboard/instructor/profile/edit",
      student: "/dashboard/student/profile/edit",
      superadmin: "/dashboard/admin/profile/edit",
    };
    const profilePath = profilePaths[role];
    const currentPath = router.pathname;
    const onProfileCompletionRoute = profilePath ? currentPath.startsWith(profilePath) : false;
    const onEmailVerificationRoute = currentPath.startsWith("/auth/verify-email");

    if (!hydrated || !user || redirectDecision) {
      return null;
    }

    if (!user.profile_complete && profilePath && !onProfileCompletionRoute) {
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
