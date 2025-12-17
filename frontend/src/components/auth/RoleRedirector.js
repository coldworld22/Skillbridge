// ───────────────────────────────────────
// 📁 frontend/src/pages/auth/login.js
//  ──────────────────────────────────────
import { useEffect } from "react";
import { useRouter } from "next/router";
import useAuthStore from "@/store/auth/authStore";

export default function RoleRedirector() {
  const { user, hasHydrated } = useAuthStore();
  const router = useRouter();

  // ───────────────────────────────
  // 🔄 Redirect based on user role
  // ───────────────────────────────
  useEffect(() => {
    if (!hasHydrated || !user) return;
    else if (user.role === "Instructor") router.replace("/dashboard/instructor");
    else if (user.role === "Student") router.replace("/dashboard/student");
  }, [user, hasHydrated, router]);


  return null;
}
