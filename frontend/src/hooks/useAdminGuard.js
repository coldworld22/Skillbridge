import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { isTokenExpired } from "@/utils/auth/tokenUtils";

/**
 * Hook that verifies the current user is an admin or superadmin.
 * Redirects unauthenticated or unauthorized users and returns
 * whether the admin check has passed.
 */
export default function useAdminGuard() {
  const { user, accessToken, logout, hasHydrated } = useAuthStore();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;

    const role = user?.role?.toLowerCase();
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (!accessToken || isTokenExpired(accessToken)) {
      logout();
      router.replace("/auth/login");
      return;
    }
    if (!["admin", "superadmin"].includes(role)) {
      router.replace("/error/403");
      return;
    }

    setAuthorized(true);
  }, [hasHydrated, user, accessToken, logout, router]);

  return authorized;
}

