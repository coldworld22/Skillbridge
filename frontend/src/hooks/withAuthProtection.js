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
    const { user, accessToken, logout } = useAuthStore((state) => ({
      user: state.user,
      accessToken: state.accessToken,
      logout: state.logout,
    }));
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);
    const normalizedRoles = useMemo(
      () => allowedRoles.map((role) => role.toLowerCase()),
      [allowedRoles]
    );
    useEffect(() => {
      setHydrated(true);
    }, []);

    const redirectDecision = useMemo(() => {
      if (!hydrated) return null;

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
        return { destination: "/auth/login", logout: false };
      }

      if (!accessToken || isTokenExpired(accessToken)) {
        return { destination: "/auth/login", logout: true };
      }

      if (!user.profile_complete && !onProfileCompletionRoute) {
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
    }, [hydrated, user, accessToken, allowedPerms, normalizedRoles, router.pathname]);

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
    const profilePath = profilePaths[role] || "/profile/edit";
    const currentPath = router.pathname;
    const onProfileCompletionRoute = profilePath && currentPath.startsWith(profilePath);
    const onEmailVerificationRoute = currentPath.startsWith("/auth/verify-email");

    if (!hydrated || !user || redirectDecision) {
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
