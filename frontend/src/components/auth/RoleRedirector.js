// src/components/auth/RoleRedirector.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";

export default function RoleRedirector() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    switch (user.role) {
      case "admin":
      case "superadmin":
        router.replace("/dashboard/admin");
        break;
      case "instructor":
        router.replace("/dashboard/instructor");
        break;
      case "student":
        router.replace("/dashboard/student");
        break;
      default:
        router.replace("/website");
    }
  }, [user]);

  return null;
}
