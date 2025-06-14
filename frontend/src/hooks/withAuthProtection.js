// src/hooks/withAuthProtection.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";
import { isTokenExpired } from "@/utils/auth/tokenUtils";

export default function withAuthProtection(Component, allowedRoles = []) {
  return function ProtectedPage(props) {
    const { user, accessToken, logout } = useAuthStore();
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
      setHydrated(true);
    }, []);

    useEffect(() => {
      if (hydrated) {
        if (!user) {
          router.replace("/auth/login");
        } else if (!accessToken || isTokenExpired(accessToken)) {
          logout();
          router.replace("/auth/login");
        } else if (
          allowedRoles.length &&
          !allowedRoles.includes(user.role?.toLowerCase())
        ) {
          router.replace("/403");
        }
      }
    }, [hydrated, user, accessToken]);

    if (!hydrated || !user || (allowedRoles.length && !allowedRoles.includes(user.role?.toLowerCase()))) {
      return null;
    }

    return <Component {...props} />;
  };
}
