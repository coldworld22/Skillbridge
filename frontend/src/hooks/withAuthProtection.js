// src/hooks/withAuthProtection.js
import { useEffect, useState } from "react";
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
    const normalizedRoles = allowedRoles.map((role) => role.toLowerCase());

    useEffect(() => {
      setHydrated(true);
    }, []);

    useEffect(() => {
      if (!hydrated) return;

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
        router.replace("/auth/login");
        return;
      }

      if (!accessToken || isTokenExpired(accessToken)) {
        logout();
        router.replace("/auth/login");
        return;
      }

      if (!user.profile_complete && !onProfileCompletionRoute) {
        router.replace(profilePath);
        return;
      }

      if (user.profile_complete && !user.is_email_verified && !onEmailVerificationRoute) {
        router.replace("/auth/verify-email");
        return;
      }

      if (
        (normalizedRoles.length && !normalizedRoles.includes(role)) ||
        (allowedPerms.length &&
          role !== "superadmin" &&
          !allowedPerms.some((p) => user.permissions?.includes(p)))
      ) {
        router.replace("/error/403");
      }
    }, [hydrated, user, accessToken, logout, router, allowedPerms]);

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
