// components/auth/RequireProfileCompletion.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import useAuthStore from "@/store/auth/authStore";

const roleRedirects = {
  admin: "/dashboard/admin/profile/edit",
  instructor: "/dashboard/instructor/profile/edit",
  student: "/dashboard/student/profile/edit",
};

export default function RequireProfileCompletion({ children }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const userRole = user?.role?.toLowerCase();

  useEffect(() => {
    if (user && user.profile_complete === false) {
      const targetPath = roleRedirects[userRole] || "/auth/login";

      // Avoid redirecting if already on the profile page
      if (router.pathname !== targetPath) {
        toast.info("Please complete your profile to continue.");
        router.replace(targetPath);
      }
    }
  }, [user, userRole, router]);

  return <>{children}</>;
}
